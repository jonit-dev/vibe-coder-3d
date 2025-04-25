#!/usr/bin/env python3
import bpy, sys, os
from mathutils import Vector

# --- parse command-line arguments ---
argv = sys.argv
if "--" not in argv:
    raise RuntimeError(
        "Usage: blender --background --python fix_model_origin.py -- <input_path> <output_path> [--preserve-animations]"
    )
avg = argv[argv.index("--") + 1:]
input_path, output_path = avg[0], avg[1]
preserve_animations = False
if len(avg) > 2 and avg[2] == '--preserve-animations':
    preserve_animations = True
print(f"[INFO] Input: {input_path}")
print(f"[INFO] Output: {output_path}")
print(f"[INFO] preserve_animations: {preserve_animations}")

# --- clear existing scene ---
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
print("[INFO] Cleared scene")

# --- import model ---
ext = os.path.splitext(input_path)[1].lower()
if ext == '.fbx':
    print("[INFO] Importing FBX...")
    bpy.ops.import_scene.fbx(filepath=input_path)
elif ext in ('.glb', '.gltf'):
    print("[INFO] Importing GLTF/GLB...")
    bpy.ops.import_scene.gltf(filepath=input_path)
else:
    raise RuntimeError(f"Unsupported extension: {ext}")
print("[INFO] Import complete")

# --- Debug scene structure after import ---
print("[DEBUG] Scene after import:")
for obj in bpy.context.scene.objects:
    print(f"  {obj.name} [{obj.type}] parent={obj.parent.name if obj.parent else None} location={obj.location}")

# --- Fix RootNode if it's an armature ---
root_armature = None
for obj in bpy.context.scene.objects:
    if obj.type == 'ARMATURE' and obj.name == 'RootNode':
        root_armature = obj
        print(f"[INFO] Found armature named 'RootNode' at location {obj.location} with matrix_world=\n{obj.matrix_world}")
        
        # Rename it to something more appropriate
        obj.name = 'Character_Armature'
        print(f"[INFO] Renamed 'RootNode' armature to 'Character_Armature'")
        
        # Select and make active to manipulate
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        
        # Apply transforms to reset scale, rotation, position
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        print(f"[INFO] Applied transforms to armature, new location: {obj.location}, matrix_world=\n{obj.matrix_world}")
        
        break

# --- reparent mesh/armature to world if under EMPTY (e.g., RootNode) ---
for obj in bpy.context.scene.objects:
    if obj.type in {'MESH', 'ARMATURE'} and obj.parent and obj.parent.type == 'EMPTY':
        print(f"[INFO] Found {obj.name} under EMPTY parent {obj.parent.name}, unparenting...")
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
        obj.select_set(False)
print("[INFO] Cleared parent from mesh/armature under EMPTY root.")

# --- remove any EMPTY objects (e.g., RootNode) ---
empties = [o for o in bpy.context.scene.objects if o.type == 'EMPTY']
for e in empties:
    print(f"[INFO] Removing EMPTY: {e.name}")
    bpy.data.objects.remove(e, do_unlink=True)
print(f"[INFO] Removed {len(empties)} empties.")

# --- locate mesh and optional armature ---
mesh = next((o for o in bpy.context.scene.objects if o.type == 'MESH'), None)
arm = next((o for o in bpy.context.scene.objects if o.type == 'ARMATURE'), None)
if not mesh:
    raise RuntimeError("No mesh found!")
if arm:
    print(f"[DEBUG] Found armature: {arm.name} at {arm.location} with matrix_world=\n{arm.matrix_world}")
if mesh:
    print(f"[DEBUG] Found mesh: {mesh.name} at {mesh.location} with matrix_world=\n{mesh.matrix_world}")

bpy.context.scene.frame_set(0)

# --- clear any remaining parent transforms for mesh/armature ---
if mesh.parent and mesh.parent != arm:
    print(f"[INFO] Clearing parent for mesh: {mesh.name} (parent was {mesh.parent.name})")
    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    mesh.select_set(False)
    print(f"[INFO] Cleared mesh parent. New location: {mesh.location}, matrix_world=\n{mesh.matrix_world}")
    
if arm and arm.parent:
    print(f"[INFO] Clearing parent for armature: {arm.name} (parent was {arm.parent.name})")
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    arm.select_set(False)
    print(f"[INFO] Cleared armature parent. New location: {arm.location}, matrix_world=\n{arm.matrix_world}")

# --- bake T-pose if armature ---
if arm:
    print(f"[INFO] Armature present: {arm.name} at {arm.location}. No animation stripping or baking performed.")

# --- ensure mesh is unparented ---
if mesh.parent and (not arm or mesh.parent != arm):
    print(f"[INFO] Unparenting mesh {mesh.name} from {mesh.parent.name}")
    bpy.ops.object.select_all(action='DESELECT')
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = mesh
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    print(f"[INFO] Mesh unparented. New location: {mesh.location}, matrix_world=\n{mesh.matrix_world}")

# --- ensure mesh is parented to armature (if present) ---
if arm and mesh.parent != arm:
    print(f"[INFO] Parenting mesh {mesh.name} to armature {arm.name}")
    bpy.ops.object.select_all(action='DESELECT')
    mesh.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type='ARMATURE', keep_transform=True)
    print(f"[INFO] Mesh parented to armature. Mesh location: {mesh.location}, Arm location: {arm.location}")

# --- apply transforms to armature first ---
if arm:
    print(f"[INFO] Applying transforms to armature {arm.name}")
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    print(f"[INFO] Armature transforms applied. New location: {arm.location}, matrix_world=\n{arm.matrix_world}")

# --- apply transforms to mesh ---
print(f"[INFO] Applying transforms to mesh {mesh.name}")
bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True)
bpy.context.view_layer.objects.active = mesh
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print(f"[INFO] Mesh transforms applied. New location: {mesh.location}, matrix_world=\n{mesh.matrix_world}")

# --- compute bounding box bottom center ---
bbox = [Vector(v) for v in mesh.bound_box]
xs = [v.x for v in bbox]
ys = [v.y for v in bbox]
zs = [v.z for v in bbox]
print(f"[DEBUG] Bounding box X: {xs}")
print(f"[DEBUG] Bounding box Y: {ys}")
print(f"[DEBUG] Bounding box Z: {zs}")
center_x = (min(xs) + max(xs)) / 2
center_y = (min(ys) + max(ys)) / 2
min_z = min(zs)
print(f"[DEBUG] center_x: {center_x}, center_y: {center_y}, min_z: {min_z}")

# --- set cursor to bottom center of bounding box ---
bpy.context.scene.cursor.location = (center_x, center_y, min_z)
print(f"[DEBUG] Cursor location set to: {bpy.context.scene.cursor.location}")

# --- set origin for armature first (if exists) ---
if arm:
    print(f"[INFO] Setting armature origin to cursor (bottom center)")
    print(f"[DEBUG] Armature location before origin set: {arm.location}")
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    print(f"[DEBUG] Armature location after origin set: {arm.location}")
    arm.location = (0.0, 0.0, 0.0)
    print(f"[DEBUG] Armature location after moving to world origin: {arm.location}")
    arm_origin_world = arm.matrix_world @ Vector((0,0,0))
    print(f"[DEBUG] Armature origin in world space: {arm_origin_world}")

# --- then set origin for mesh --- 
print(f"[DEBUG] Mesh location before origin set: {mesh.location}")
bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True)
bpy.context.view_layer.objects.active = mesh
bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
print(f"[DEBUG] Mesh location after origin set: {mesh.location}")
if not arm:  # Only move mesh to origin if no armature
    mesh.location = (0.0, 0.0, 0.0)
    print(f"[DEBUG] Mesh location after moving to world origin: {mesh.location}")
# Confirm origin in world space
mesh_origin_world = mesh.matrix_world @ Vector((0,0,0))
print(f"[DEBUG] Mesh origin in world space: {mesh_origin_world}")
print("[INFO] Origin set at floor level.")

# --- export directly to the main output path ---
print(f"[DEBUG] Exporting to: {output_path}")
# Debug: print all objects in the scene before export
print('[DEBUG] Objects in scene before export:')
for obj in bpy.context.scene.objects:
    parent_name = obj.parent.name if obj.parent else None
    print(f'  {obj.name} [{obj.type}] parent={parent_name} location={obj.location} matrix_world=\n{obj.matrix_world}')
    
# Select both mesh and armature (if present) for export
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

# --- Extra logging for debugging collision/capsule issues ---
# Print mesh bounding box and origin after export
bbox = [Vector(v) for v in mesh.bound_box]
xs = [v.x for v in bbox]
ys = [v.y for v in bbox]
zs = [v.z for v in bbox]
min_x, max_x = min(xs), max(xs)
min_y, max_y = min(ys), max(ys)
min_z, max_z = min(zs), max(zs)
print(f"[DEBUG] FINAL Bounding box X: {min_x} to {max_x}")
print(f"[DEBUG] FINAL Bounding box Y: {min_y} to {max_y}")
print(f"[DEBUG] FINAL Bounding box Z: {min_z} to {max_z}")
print(f"[DEBUG] FINAL Mesh origin: {mesh.location}")
print(f"[DEBUG] FINAL Mesh lowest vertex Z: {min_z}")
if arm:
    print(f"[DEBUG] FINAL Armature origin: {arm.location}")
    print(f"[DEBUG] FINAL Armature world matrix: \n{arm.matrix_world}")
