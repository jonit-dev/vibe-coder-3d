#!/usr/bin/env python3
import bpy
import sys
import os
from mathutils import Vector
import subprocess

# --- Parse command-line arguments ---
argv = sys.argv
if "--" not in argv:
    print("Usage: blender --background --python convert-low-poly.py -- <input_path> <output_path> [options]")
    print("Options:")
    print("  --ratio <value>            : Decimation ratio (0.01-1.0, default: 0.15)")
    print("  --texture-size <pixels>    : Resize textures to this resolution (default: 512)")
    print("  --normal-map-size <pixels> : Separate size for normal maps (default: same as texture-size)")
    print("  --keep-original-textures   : Don't resize any textures (preserves texture quality)")
    print("  --remove-textures          : Remove all textures (smallest file size)")
    print("  --fix-origin               : Fix model origin to bottom center (default: true)")
    print("  --quality <1-5>            : Preset quality level (1=smallest, 5=highest quality)")
    print("  --texture-format <format>  : Preferred texture format (png, jpeg) (default: png)")
    print("  --texture-quality <0-100>  : JPEG quality when using JPEG format (default: 90)")
    print("  --apply-texture <image_path> : Apply the specified image as a texture to all meshes")
    print("  --webp                     : Automatically convert textures to WebP after export")
    sys.exit(1)
    
args = argv[argv.index("--") + 1:]
input_path = args[0]
output_path = args[1]

# Add --glb flag to control whether to export as GLB or FBX
proceed_with_glb = '--glb' in args

# Ensure output has .glb extension only if --glb is present
if proceed_with_glb:
    if not output_path.lower().endswith('.glb'):
        output_path = f"{os.path.splitext(output_path)[0]}.glb"
        print(f"[INFO] Corrected output path to: {output_path}")

# Default settings - balanced approach
ratio = 0.15  # 15% of original vertices
texture_size = 512  # Resize textures to 512px
normal_map_size = None  # Will use texture_size if not specified
remove_textures = False
fix_origin = True
keep_original_textures = False
texture_format = 'PNG'  # Default to PNG for better quality
texture_quality = 90  # JPEG quality if using JPEG

# Add --webp flag for automatic WebP pipeline
use_webp_flag = '--webp' in args
if use_webp_flag:
    print('[INFO] --webp flag detected: will export as JPEG (low quality/size) and post-process to WebP')
    texture_format = 'JPEG'
    texture_quality = 30
    texture_size = 32

# Parse quality presets if specified
if '--quality' in args:
    idx = args.index('--quality')
    if idx + 1 < len(args):
        try:
            quality = int(args[idx + 1])
            if quality == 1:  # Ultra compression
                ratio = 0.05
                texture_size = 256
                texture_format = 'JPEG'
                texture_quality = 75
            elif quality == 2:  # High compression
                ratio = 0.1
                texture_size = 512
                texture_format = 'JPEG'
                texture_quality = 85
            elif quality == 3:  # Balanced (default)
                ratio = 0.15
                texture_size = 1024
                texture_format = 'PNG'
            elif quality == 4:  # Good quality
                ratio = 0.25
                texture_size = 2048
                texture_format = 'PNG'
            elif quality == 5:  # High quality
                ratio = 0.4
                texture_size = 4096
                texture_format = 'PNG'
                keep_original_textures = True
            print(f"[INFO] Using quality preset {quality}")
        except ValueError:
            print(f"Invalid quality value: {args[idx + 1]}, using defaults")

# Parse additional parameters (override presets if specified)
if '--ratio' in args:
    idx = args.index('--ratio')
    if idx + 1 < len(args):
        try:
            ratio = float(args[idx + 1])
        except ValueError:
            print(f"Invalid ratio value: {args[idx + 1]}")
            sys.exit(1)

if '--texture-size' in args:
    idx = args.index('--texture-size')
    if idx + 1 < len(args):
        try:
            texture_size = int(args[idx + 1])
        except ValueError:
            print(f"Invalid texture size: {args[idx + 1]}")

if '--normal-map-size' in args:
    idx = args.index('--normal-map-size')
    if idx + 1 < len(args):
        try:
            normal_map_size = int(args[idx + 1])
        except ValueError:
            print(f"Invalid normal map size: {args[idx + 1]}")

if '--texture-format' in args:
    idx = args.index('--texture-format')
    if idx + 1 < len(args):
        fmt = args[idx + 1].upper()
        if fmt in ['PNG', 'JPEG']:
            texture_format = fmt
        else:
            print(f"Invalid texture format: {args[idx + 1]}, using {texture_format}")

if '--texture-quality' in args:
    idx = args.index('--texture-quality')
    if idx + 1 < len(args):
        try:
            texture_quality = int(args[idx + 1])
            if texture_quality < 0:
                texture_quality = 0
            elif texture_quality > 100:
                texture_quality = 100
        except ValueError:
            print(f"Invalid texture quality: {args[idx + 1]}")

if '--remove-textures' in args:
    remove_textures = True
    keep_original_textures = False

if '--keep-original-textures' in args:
    keep_original_textures = True
    
if '--no-fix-origin' in args:
    fix_origin = False

# Add support for --apply-texture <image_path>
apply_texture_path = None
if '--apply-texture' in args:
    idx = args.index('--apply-texture')
    if idx + 1 < len(args):
        apply_texture_path = args[idx + 1]
        print(f"[INFO] Will apply texture: {apply_texture_path}")

# Set normal map size if not specified
if normal_map_size is None:
    normal_map_size = texture_size

print(f"[INFO] Input: {input_path}")
print(f"[INFO] Output: {output_path}")
print(f"[INFO] Decimation ratio: {ratio}")
if remove_textures:
    print(f"[INFO] Textures: Removed")
elif keep_original_textures:
    print(f"[INFO] Textures: Keeping originals (best quality)")
else:
    print(f"[INFO] Texture size: {texture_size}px")
    print(f"[INFO] Normal map size: {normal_map_size}px")
    print(f"[INFO] Texture format: {texture_format}")
    if texture_format == 'JPEG':
        print(f"[INFO] JPEG quality: {texture_quality}")
print(f"[INFO] Fix origin: {fix_origin}")

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

# --- Remove animations (to reduce file size) ---
if hasattr(bpy.data, 'actions'):
    for action in bpy.data.actions:
        bpy.data.actions.remove(action)
    print("[INFO] Removed all animations")

# --- Find armature and main mesh ---
armature = None
meshes = []

for obj in bpy.context.scene.objects:
    if obj.type == 'ARMATURE':
        armature = obj
    elif obj.type == 'MESH':
        meshes.append(obj)

if armature:
    print(f"[INFO] Found armature: {armature.name}")
if meshes:
    print(f"[INFO] Found {len(meshes)} mesh objects")

# --- Optionally apply a texture to all meshes ---
if apply_texture_path:
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
        img = bpy.data.images.load(apply_texture_path)
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
    # If exporting as FBX, print a warning about external texture
    if not proceed_with_glb:
        print("[WARNING] For FBX export, the texture file must be present alongside the FBX for it to show in other viewers.")
else:
    # --- Process textures if keeping them ---
    if not remove_textures:
        if not keep_original_textures:
            # Identify normal maps for special handling
            normal_maps = []
            regular_textures = []
            
            # First pass to identify texture types
            for mat in bpy.data.materials:
                if mat.use_nodes:
                    for node in mat.node_tree.nodes:
                        if node.type == 'TEX_IMAGE' and node.image:
                            is_normal_map = False
                            # Check connections to see if it's a normal map
                            for output in node.outputs:
                                for link in output.links:
                                    if link.to_node.type == 'NORMAL_MAP':
                                        normal_maps.append(node.image)
                                        is_normal_map = True
                                        break
                            if not is_normal_map:
                                regular_textures.append(node.image)
            
            # Resize normal maps with higher quality
            for img in normal_maps:
                if img.has_data and img.size[0] > 0 and img.size[1] > 0:
                    # Skip if already smaller than target size
                    if img.size[0] <= normal_map_size and img.size[1] <= normal_map_size:
                        continue
                        
                    print(f"[INFO] Resizing normal map {img.name} from {img.size[0]}x{img.size[1]} to {normal_map_size}x{normal_map_size}")
                    img.scale(normal_map_size, normal_map_size)
                    img.file_format = 'PNG'  # Always use PNG for normal maps
                    
            # Resize regular textures
            for img in regular_textures:
                if img.has_data and img.size[0] > 0 and img.size[1] > 0:
                    # Skip if already smaller than target size
                    if img.size[0] <= texture_size and img.size[1] <= texture_size:
                        continue
                    print(f"[INFO] Resizing texture {img.name} from {img.size[0]}x{img.size[1]} to {texture_size}x{texture_size}")
                    img.scale(texture_size, texture_size)
            
            # Handle any images not processed yet
            for img in bpy.data.images:
                if img not in normal_maps and img not in regular_textures:
                    if img.has_data and img.size[0] > 0 and img.size[1] > 0:
                        if img.size[0] <= texture_size and img.size[1] <= texture_size:
                            continue
                        print(f"[INFO] Resizing other texture {img.name} from {img.size[0]}x{img.size[1]} to {texture_size}x{texture_size}")
                        img.scale(texture_size, texture_size)
            
            print(f"[INFO] Processed {len(normal_maps)} normal maps at {normal_map_size}px and {len(regular_textures)} regular textures at {texture_size}px")
        else:
            print(f"[INFO] Keeping all original textures at full resolution")
    else:
        # Simplify or remove textures if requested
        simple_mat = bpy.data.materials.new(name="SimpleMaterial")
        simple_mat.use_nodes = True
        nodes = simple_mat.node_tree.nodes
        
        # Clear all nodes except the output
        for node in list(nodes):
            if node.type != 'OUTPUT_MATERIAL':
                nodes.remove(node)
            
        # Add a basic diffuse shader
        diffuse = nodes.new(type='ShaderNodeBsdfDiffuse')
        diffuse.inputs[0].default_value = (0.8, 0.8, 0.8, 1.0)  # Light gray
        
        # Connect to output
        output = nodes.get('Material Output')
        simple_mat.node_tree.links.new(diffuse.outputs['BSDF'], output.inputs['Surface'])
        
        # Remove all textures
        for img in bpy.data.images:
            bpy.data.images.remove(img)
        
        # Apply the simple material to all objects
        for obj in meshes:
            obj.data.materials.clear()
            obj.data.materials.append(simple_mat)
        
        print("[INFO] Removed all textures and simplified materials")

# --- Decimate all mesh objects ---
for obj in meshes:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    
    # Light cleanup to preserve more details
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=0.0005)  # Less aggressive merge
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Apply decimate modifier
    dec = obj.modifiers.new(name="Decimate", type='DECIMATE')
    dec.ratio = ratio
    
    # Add a smooth modifier after decimation to improve appearance
    smooth = obj.modifiers.new(name="Smooth", type='SMOOTH')
    smooth.iterations = 1
    
    # Apply modifiers
    bpy.ops.object.modifier_apply(modifier=dec.name)
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    
    # Keep vertex normals to maintain model smoothness
    mesh = obj.data
    mesh.use_auto_smooth = True
    mesh.auto_smooth_angle = 0.523599  # 30 degrees
    
    obj.select_set(False)
    print(f"[INFO] Reduced {obj.name} to {len(obj.data.vertices)} vertices")

# --- Fix model origin (from blender_prepare_tpose.py) ---
if fix_origin and meshes:
    # Find main mesh (if we have multiple)
    main_mesh = meshes[0]
    if len(meshes) > 1:
        # Use the one with most vertices as main
        main_mesh = max(meshes, key=lambda obj: len(obj.data.vertices))
    
    # Compute bounding box bottom center
    bbox = [Vector(v) for v in main_mesh.bound_box]
    xs = [v.x for v in bbox]
    ys = [v.y for v in bbox]
    zs = [v.z for v in bbox]
    
    center_x = (min(xs) + max(xs)) / 2
    center_y = (min(ys) + max(ys)) / 2
    min_z = min(zs)
    
    # Set cursor to bottom center of bounding box
    bpy.context.scene.cursor.location = (center_x, center_y, min_z)
    print(f"[DEBUG] Cursor set to bottom center at: {center_x}, {center_y}, {min_z}")
    
    # Set origin for armature first (if exists)
    if armature:
        print(f"[INFO] Setting armature origin to cursor (bottom center)")
        bpy.ops.object.select_all(action='DESELECT')
        armature.select_set(True)
        bpy.context.view_layer.objects.active = armature
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        armature.location = (0.0, 0.0, 0.0)
        print(f"[INFO] Armature moved to world origin (0,0,0)")
    
    # Set origin for all meshes
    for obj in meshes:
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        
        # Only move to origin if not part of armature
        if not obj.parent or obj.parent.type != 'ARMATURE':
            obj.location = (0.0, 0.0, 0.0)
    
    print("[INFO] Origins set to bottom center and aligned to world origin")

# --- Export model ---
if proceed_with_glb:
    # Export as GLB (and post-process as needed)
    print('[INFO] --glb flag present. Exporting as GLB.')
    bpy.ops.object.select_all(action='SELECT')

    # Set export options for balanced file size and quality
    export_settings = {
        'filepath': output_path,
        'export_format': 'GLB',
        'use_selection': True,
        'export_draco_mesh_compression_enable': True,
        'export_draco_mesh_compression_level': 7,
        'export_draco_position_quantization': 14,
        'export_draco_normal_quantization': 10,
        'export_draco_texcoord_quantization': 12,
        'export_draco_color_quantization': 10,
        'export_tangents': True,
        'export_materials': True,
        'export_colors': True,
        'export_cameras': False,
        'export_lights': False,
        'export_extras': False,
        'export_yup': True
    }

    # Adjust export settings based on texture quality preferences
    if keep_original_textures:
        export_settings['export_image_format'] = 'AUTO'
        export_settings['export_jpeg_quality'] = 100
    elif texture_format == 'JPEG':
        export_settings['export_image_format'] = 'JPEG'
        export_settings['export_jpeg_quality'] = texture_quality
    else:
        export_settings['export_image_format'] = 'AUTO'

    # Try to use advanced export settings if available
    try:
        bpy.ops.export_scene.gltf(**export_settings)
    except TypeError as e:
        # Fall back to basic export if some parameters aren't supported
        print(f"[WARNING] Using simplified export settings: {e}")
        bpy.ops.export_scene.gltf(
            filepath=output_path,
            export_format='GLB',
            use_selection=True,
            export_draco_mesh_compression_enable=True
        )

    print(f"[INFO] Exported optimized low-poly model to: {output_path}")

    # Report file size
    if os.path.exists(output_path):
        size_bytes_before_webp = os.path.getsize(output_path)
        size_kb_before_webp = size_bytes_before_webp / 1024
        print(f"[INFO] File size before WebP: {size_kb_before_webp:.2f} KB ({size_bytes_before_webp} bytes)")
    else:
        size_bytes_before_webp = None

    # --- Call fix-origin-bottom.py to robustly fix the origin ---
    fix_origin_script = os.path.join(os.path.dirname(__file__), 'fix-origin-bottom.py')
    if os.path.exists(fix_origin_script):
        print(f"[INFO] Running fix-origin-bottom.py on {output_path}")
        blender_path = os.environ.get('BLENDER_PATH', 'blender')
        result = subprocess.run([
            blender_path, '--background', '--python', fix_origin_script, '--', output_path, output_path
        ], capture_output=True, text=True)
        print(result.stdout)
        if result.returncode != 0:
            print(f"[ERROR] fix-origin-bottom.py failed: {result.stderr}")
        else:
            print(f"[INFO] Origin fix complete for {output_path}")
    else:
        print(f"[WARNING] fix-origin-bottom.py not found, skipping origin fix.")

    # After export and origin fix, post-process with gltf-transform if webp is requested or --webp flag is set
    if texture_format.lower() == 'webp' or use_webp_flag:
        print(f"[INFO] Converting textures to WebP using gltf-transform...")
        try:
            result = subprocess.run([
                'npx', 'gltf-transform', 'webp', output_path, output_path
            ], capture_output=True, text=True)
            print(result.stdout)
            if result.returncode != 0:
                print(f"[ERROR] gltf-transform webp failed: {result.stderr}")
            else:
                print(f"[INFO] WebP texture conversion complete for {output_path}")
        except Exception as e:
            print(f"[ERROR] Failed to run gltf-transform webp: {e}")

    # Final file size and reduction summary
    if os.path.exists(output_path):
        size_bytes_final = os.path.getsize(output_path)
        size_kb_final = size_bytes_final / 1024
        print(f"[INFO] Final file size: {size_kb_final:.2f} KB ({size_bytes_final} bytes)")
        if size_bytes_before_webp and size_bytes_final < size_bytes_before_webp:
            reduction = 100 * (size_bytes_before_webp - size_bytes_final) / size_bytes_before_webp
            print(f"[SUMMARY] Size reduction: {size_kb_before_webp:.2f} KB → {size_kb_final:.2f} KB (↓{reduction:.1f}%)")
        elif size_bytes_before_webp:
            print(f"[SUMMARY] No size reduction after WebP conversion.")
else:
    # Export as FBX only
    print('[INFO] --glb flag not present. Exporting as FBX only.')
    print(f"[DEBUG] Output path: '{output_path}'")
    output_path_clean = output_path.strip().lower()
    if output_path_clean.endswith('.fbx'):
        bpy.ops.export_scene.fbx(filepath=output_path, use_selection=False)
        print(f"[INFO] Exported as FBX: {output_path}")
    else:
        print(f"[ERROR] Output path must end with .fbx if --glb is not specified.")
        sys.exit(1) 
