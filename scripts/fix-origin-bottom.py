#!/usr/bin/env python3
import bpy
import sys
import os
from mathutils import Vector

# --- Parse command-line arguments ---
argv = sys.argv
if "--" not in argv:
    print("Usage: blender --background --python fix-origin-bottom.py -- <input_path> <output_path>")
    sys.exit(1)
args = argv[argv.index("--") + 1:]
input_path, output_path = args[0], args[1]

print(f"[INFO] Input: {input_path}")
print(f"[INFO] Output: {output_path}")

# --- Clear existing scene ---
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
print("[INFO] Cleared scene")

# --- Import model ---
ext = os.path.splitext(input_path)[1].lower()
if ext == '.fbx':
    print("[INFO] Importing FBX...")
    bpy.ops.import_scene.fbx(filepath=input_path)
elif ext in ('.glb', '.gltf'):
    print("[INFO] Importing GLTF/GLB...")
    bpy.ops.import_scene.gltf(filepath=input_path)
else:
    print(f"Unsupported file extension: {ext}")
    sys.exit(1)
print("[INFO] Import complete")

# --- Debug scene structure after import ---
for obj in bpy.context.scene.objects:
    print(f"  {obj.name} [{obj.type}] parent={obj.parent.name if obj.parent else None} location={obj.location}")

# --- Fix RootNode if it's an armature ---
for obj in bpy.context.scene.objects:
    if obj.type == 'ARMATURE' and obj.name == 'RootNode':
        obj.name = 'Character_Armature'
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        break

# --- Reparent mesh/armature to world if under EMPTY ---
for obj in bpy.context.scene.objects:
    if obj.type in {'MESH', 'ARMATURE'} and obj.parent and obj.parent.type == 'EMPTY':
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
        obj.select_set(False)

# --- Remove any EMPTY objects ---
empties = [o for o in bpy.context.scene.objects if o.type == 'EMPTY']
for e in empties:
    bpy.data.objects.remove(e, do_unlink=True)

# --- Locate mesh and optional armature ---
mesh = next((o for o in bpy.context.scene.objects if o.type == 'MESH'), None)
arm = next((o for o in bpy.context.scene.objects if o.type == 'ARMATURE'), None)
if not mesh:
    print("No mesh found!")
    sys.exit(1)

bpy.context.scene.frame_set(0)

# --- Clear any remaining parent transforms for mesh/armature ---
if mesh.parent and (not arm or mesh.parent != arm):
    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    mesh.select_set(False)
if arm and arm.parent:
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    arm.select_set(False)

# --- Ensure mesh is parented to armature (if present) ---
if arm and mesh.parent != arm:
    bpy.ops.object.select_all(action='DESELECT')
    mesh.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type='ARMATURE', keep_transform=True)

# --- Apply transforms to armature first ---
if arm:
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# --- Apply transforms to mesh ---
bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True)
bpy.context.view_layer.objects.active = mesh
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# --- Compute bounding box bottom center ---
bbox = [Vector(v) for v in mesh.bound_box]
xs = [v.x for v in bbox]
ys = [v.y for v in bbox]
zs = [v.z for v in bbox]
center_x = (min(xs) + max(xs)) / 2
center_y = (min(ys) + max(ys)) / 2
min_z = min(zs)

# --- Set cursor to bottom center of bounding box ---
bpy.context.scene.cursor.location = (center_x, center_y, min_z)

# --- Set origin for armature first (if exists) ---
if arm:
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    arm.location = (0.0, 0.0, 0.0)

# --- Then set origin for mesh ---
bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True)
bpy.context.view_layer.objects.active = mesh
bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
if not arm:
    mesh.location = (0.0, 0.0, 0.0)

# --- Export to output path ---
bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True)
if arm:
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
else:
    bpy.context.view_layer.objects.active = mesh
bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format='GLB'
)
print(f"[INFO] Exported: {output_path}") 
