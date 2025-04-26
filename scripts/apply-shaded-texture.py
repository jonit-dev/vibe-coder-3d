#!/usr/bin/env python3
import bpy
import sys
import os

# --- Parse command-line arguments ---
argv = sys.argv
if "--" not in argv:
    print("Usage: blender --background --python apply-shaded-texture.py -- <input_path> <output_path> [--color <r> <g> <b> <a>] [--image <image_path>]")
    print("  --color <r> <g> <b> <a> : Diffuse RGBA color (0-1, default: 0.8 0.8 0.8 1.0)")
    sys.exit(1)

args = argv[argv.index("--") + 1:]
input_path = args[0]
output_path = args[1]

# Default color: light gray
color = (0.8, 0.8, 0.8, 1.0)
image_path = None
if '--color' in args:
    idx = args.index('--color')
    try:
        color = tuple(float(args[idx + i]) for i in range(1, 5))
    except Exception:
        print("[WARNING] Invalid color values, using default.")
if '--image' in args:
    idx = args.index('--image')
    if idx + 1 < len(args):
        image_path = args[idx + 1]
        print(f"[INFO] Using image texture: {image_path}")

print(f"[INFO] Input: {input_path}")
print(f"[INFO] Output: {output_path}")
if image_path:
    print(f"[INFO] Texture image: {image_path}")
else:
    print(f"[INFO] Diffuse color: {color}")

# --- Clean the scene ---
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# --- Import model ---
ext = os.path.splitext(input_path)[1].lower()
if ext == '.fbx':
    bpy.ops.import_scene.fbx(filepath=input_path)
elif ext in ('.glb', '.gltf'):
    bpy.ops.import_scene.gltf(filepath=input_path)
else:
    print(f"Unsupported file extension: {ext}")
    sys.exit(1)

# --- Find all mesh objects ---
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
print(f"[INFO] Found {len(meshes)} mesh objects")

# --- Create and assign material ---
if image_path:
    # Create material with image texture
    tex_mat = bpy.data.materials.new(name="ImageTextureMaterial")
    tex_mat.use_nodes = True
    nodes = tex_mat.node_tree.nodes
    links = tex_mat.node_tree.links
    # Remove all nodes except output
    for node in list(nodes):
        if node.type != 'OUTPUT_MATERIAL':
            nodes.remove(node)
    # Add Principled BSDF
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    # Add Image Texture node
    tex_image = nodes.new(type='ShaderNodeTexImage')
    try:
        img = bpy.data.images.load(image_path)
        tex_image.image = img
    except Exception as e:
        print(f"[ERROR] Could not load image: {e}")
        sys.exit(1)
    # Connect image color to BSDF base color
    links.new(tex_image.outputs['Color'], bsdf.inputs['Base Color'])
    # Connect BSDF to output
    output = nodes.get('Material Output')
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    # Remove all images (if any, except the loaded one)
    for img in bpy.data.images:
        if not (hasattr(tex_image, 'image') and img == tex_image.image):
            bpy.data.images.remove(img)
    # Assign material to all meshes
    for obj in meshes:
        obj.data.materials.clear()
        obj.data.materials.append(tex_mat)
    print("[INFO] Applied image texture material to all meshes")
else:
    # Fallback: flat color
    shaded_mat = bpy.data.materials.new(name="ShadedMaterial")
    shaded_mat.use_nodes = True
    nodes = shaded_mat.node_tree.nodes
    for node in list(nodes):
        if node.type != 'OUTPUT_MATERIAL':
            nodes.remove(node)
    diffuse = nodes.new(type='ShaderNodeBsdfDiffuse')
    diffuse.inputs[0].default_value = color
    output = nodes.get('Material Output')
    shaded_mat.node_tree.links.new(diffuse.outputs['BSDF'], output.inputs['Surface'])
    for img in bpy.data.images:
        bpy.data.images.remove(img)
    for obj in meshes:
        obj.data.materials.clear()
        obj.data.materials.append(shaded_mat)
    print("[INFO] Applied shaded material to all meshes")

# --- Export model ---
if output_path.lower().endswith('.fbx'):
    bpy.ops.export_scene.fbx(filepath=output_path, use_selection=False)
    print(f"[INFO] Exported as FBX: {output_path}")
elif output_path.lower().endswith('.glb') or output_path.lower().endswith('.gltf'):
    bpy.ops.export_scene.gltf(filepath=output_path, export_format='GLB' if output_path.lower().endswith('.glb') else 'GLTF')
    print(f"[INFO] Exported as GLB/GLTF: {output_path}")
else:
    print(f"[ERROR] Unsupported export format: {output_path}")
    sys.exit(1) 
