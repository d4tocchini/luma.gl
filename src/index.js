// Export core modules for luma.gl

// Initialize any global state
require('./init');

// WebGL
export {default as GL, glGet, glKey} from './webgl/gl-constants';
export {
  isWebGL2,
  isWebGLContext,
  isWebGL2Context,
  setContextDefaults,
  createGLContext,
  getGLExtension,
  pollContext} from './webgl/context';
export {
  resetParameters,
  getParameter,
  getParameters,
  setParameter,
  setParameters,
  withState,
  withParameters,
  glContextWithState} from './webgl/context-state';
export {
  getGLContextInfo,
  getContextLimits,
  glGetDebugInfo,
  FEATURE,
  hasFeatures} from './webgl/context-limits';
export {
  makeDebugContext} from './webgl/context-debug';
export {
  installParameterDefinitions} from './webgl/api/debug-parameters';

export {default as Buffer} from './webgl/buffer';
export {default as Shader, VertexShader, FragmentShader} from './webgl/shader';
export {default as Program} from './webgl/program';
export {default as Framebuffer} from './webgl/framebuffer';
export {default as Renderbuffer} from './webgl/renderbuffer';
export {default as Texture2D} from './webgl/texture-2d';
export {default as TextureCube} from './webgl/texture-cube';

export {draw} from './webgl/draw';
export {clear} from './webgl/clear';

// WebGL2 & Extensions
export {default as FenceSync} from './webgl/fence-sync';
export {default as Query} from './webgl/query';
export {default as Sampler} from './webgl/sampler';
export {default as Texture3D} from './webgl/texture-3d';
export {default as Texture2DArray} from './webgl/texture-2d-array';
export {default as TransformFeedback} from './webgl/transform-feedback';
export {default as VertexArray} from './webgl/vertex-array';
export {default as UniformBufferLayout} from './webgl/uniform-buffer-layout';

// Core Classes
export {default as Model} from './core/model';
export {default as AnimationLoop} from './core/animation-loop';

// Addons
export {addEvents} from './packages/events';

// Geometry
export {default as Geometry} from './geometry/geometry';
export {default as ConeGeometry} from './geometry/cone-geometry';
export {default as CubeGeometry} from './geometry/cube-geometry';
export {default as CylinderGeometry} from './geometry/cylinder-geometry';
export {default as IcoSphereGeometry} from './geometry/ico-sphere-geometry';
export {default as PlaneGeometry} from './geometry/plane-geometry';
export {default as SphereGeometry} from './geometry/sphere-geometry';
export {default as TruncatedConeGeometry} from './geometry/truncated-cone-geometry';

// Models
export {default as Cone} from './models/cone';
export {default as Cube} from './models/cube';
export {default as Cylinder} from './models/cylinder';
export {default as IcoSphere} from './models/ico-sphere';
export {default as Plane} from './models/plane';
export {default as Sphere} from './models/sphere';
export {default as TruncatedCone} from './models/truncated-cone';

export {default as ClipSpaceQuad} from './models/clip-space-quad';

// Math
export {
  radians,
  degrees} from './packages/math/src/common';
export {default as Vector2} from './packages/math/src/vector2';
export {default as Vector3} from './packages/math/src/vector3';
export {default as Vector4} from './packages/math/src/vector4';
export {default as Matrix4} from './packages/math/src/matrix4';
export {default as Quaternion} from './packages/math/src/quaternion';
export {default as Euler} from './packages/math/src/euler';

// IO
export {
  setPathPrefix,
  loadFile,
  loadImage,
  loadFiles,
  loadImages,
  loadTextures,
  loadProgram,
  loadModel,
  parseModel
} from './io';

// EXPERIMENTAL MODULES
import {
  clearBuffer
} from './webgl/clear';

// Shader Tools
import {
  registerShaderModules,
  assembleShaders,
  ShaderCache
} from './experimental/shader-tools';

// Register Shader Modules
import './experimental/shader-modules';

export const experimental = {
  clearBuffer,
  registerShaderModules,
  assembleShaders,
  ShaderCache
};

// DEPRECATED IN V4.0
// Alias for FramebufferObject (deprecated in v3). Framebuffer API is fairly similar
export {default as FramebufferObject} from './webgl/framebuffer';

// DEPRECATED IN V3.0
export {readPixels} from './webgl/functions';
export {default as Object3D} from './deprecated/scenegraph/object-3d';
export {default as Group} from './deprecated/scenegraph/group';
export {default as Scene} from './deprecated/scenegraph/scene';
export {pickModels} from './deprecated/scenegraph/pick';
export {default as Shaders} from './deprecated/shaderlib';
export {default as Fx} from './deprecated/fx';
