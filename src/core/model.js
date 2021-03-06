// A scenegraph object node
import {GL, Buffer, Program, withParameters, checkUniformValues, isWebGLContext} from '../webgl';
// import {withParameters} from '../webgl/context-state';
import {getUniformsTable} from '../webgl/uniforms';
import {getDrawMode} from '../geometry/geometry';

import Object3D from '../deprecated/scenegraph/object-3d';
import {log, formatValue} from '../utils';
import {window} from '../utils/globals';
import SHADERS from '../deprecated/shaderlib';
// import {SHADERS} from '../experimental/shaders';
import {addModel, removeModel} from '../debug/seer-integration';
import assert from 'assert';
import seer from 'seer';

const MSG_INSTANCED_PARAM_DEPRECATED = `\
Warning: Model constructor: parameter "instanced" renamed to "isInstanced".
This will become a hard error in a future version of luma.gl.`;

const ERR_MODEL_PARAMS = 'Model needs drawMode and vertexCount';

// Model abstract O3D Class
export default class Model extends Object3D {
  constructor(gl, opts = {}) {
    opts = isWebGLContext(gl) ? Object.assign({}, opts, {gl}) : gl;
    super(opts);
    this.init(opts);
  }

  /* eslint-disable max-statements  */
  /* eslint-disable complexity  */
  init({
    program,
    gl = null,
    vs = SHADERS.vs,
    fs = SHADERS.fs,
    defaultUniforms,
    shaderlibs = {},

    isInstanced = false, // Enables instanced rendering
    instanced, // deprecated
    vertexCount = undefined,
    instanceCount = 0,

    // Extra uniforms and attributes (beyond geometry, material, camera)
    drawMode,
    uniforms = {},
    attributes = {},
    geometry = null,

    // Picking
    pickable = true,
    pick = null,
    render = null,
    onBeforeRender = () => {},
    onAfterRender = () => {},

    // Other opts
    timerQueryEnabled = false
  } = {}) {
    // Assign default uniforms if any of the default shaders is being used
    if (vs === SHADERS.vs || fs === SHADERS.fs && defaultUniforms === undefined) {
      defaultUniforms = SHADERS.defaultUniforms;
    }

    // set a custom program per o3d
    this.program = program || new Program(gl, {vs, fs});
    assert(this.program instanceof Program, 'Model needs a program');

    if (instanced) {
      /* global console */
      /* eslint-disable no-console */
      console.warn(MSG_INSTANCED_PARAM_DEPRECATED);
      isInstanced = isInstanced || instanced;
    }

    // TODO - remove?
    this.buffers = {};
    this.userData = {};
    this.drawParams = {};
    this.dynamic = false;
    this.needsRedraw = true;

    // Attributes and buffers
    this.setGeometry(geometry);

    this.attributes = {};
    this.setAttributes(attributes);

    uniforms = Object.assign({}, this.program.defaultUniforms, uniforms);
    this.uniforms = {};
    this.setUniforms(uniforms);

    // geometry might have set drawMode and vertexCount
    if (drawMode !== undefined) {
      this.drawMode = getDrawMode(drawMode);
    }
    if (vertexCount !== undefined) {
      this.vertexCount = vertexCount;
    }
    this.isInstanced = isInstanced;
    this.instanceCount = instanceCount;

    // picking options
    this.pickable = Boolean(pickable);
    this.pick = pick || (() => false);

    this.onBeforeRender = onBeforeRender;
    this.onAfterRender = onAfterRender;

    // assert(program || program instanceof Program);
    assert(this.drawMode !== undefined && Number.isFinite(this.vertexCount),
      ERR_MODEL_PARAMS);

    // TimerQuery - TODO replace with Query class
    this.ext = this.program.gl.getExtension('EXT_disjoint_timer_query');
    this.timerQueryEnabled = timerQueryEnabled && this.ext !== null;
    this.timeElapsedQuery = undefined;
    this.lastQueryReturned = true;

    this.stats = {
      accumulatedFrameTime: 0,
      averageFrameTime: 0,
      profileFrameCount: 0
    };
  }
  /* eslint-enable max-statements */
  /* eslint-enable complexity */

  destroy() {
    removeModel(this.id);
  }

  setNeedsRedraw(redraw = true) {
    this.needsRedraw = redraw;
    return this;
  }

  getNeedsRedraw({clearRedrawFlags = false} = {}) {
    let redraw = false;
    redraw = redraw || this.needsRedraw;
    this.needsRedraw = this.needsRedraw && !clearRedrawFlags;
    redraw = redraw || this.geometry.getNeedsRedraw({clearRedrawFlags});
    return redraw;
  }

  setDrawMode(drawMode) {
    this.drawMode = getDrawMode(drawMode);
    return this;
  }

  getDrawMode() {
    return this.drawMode;
  }

  setVertexCount(vertexCount) {
    assert(Number.isFinite(vertexCount));
    this.vertexCount = vertexCount;
    return this;
  }

  getVertexCount() {
    return this.vertexCount;
  }

  setInstanceCount(instanceCount) {
    assert(Number.isFinite(instanceCount));
    this.instanceCount = instanceCount;
    return this;
  }

  getInstanceCount() {
    return this.instanceCount;
  }

  getProgram() {
    return this.program;
  }

  // TODO - just set attributes, don't hold on to geometry
  setGeometry(geometry) {
    this.geometry = geometry;
    this.vertexCount = geometry.getVertexCount();
    this.drawMode = geometry.drawMode;
    this._createBuffersFromAttributeDescriptors(this.geometry.getAttributes());
    this.setNeedsRedraw();
    return this;
  }

  getAttributes() {
    return this.attributes;
  }

  setAttributes(attributes = {}) {
    Object.assign(this.attributes, attributes);
    this._createBuffersFromAttributeDescriptors(attributes);
    this.setNeedsRedraw();
    return this;
  }

  getUniforms() {
    return this.uniforms;
  }

  // TODO - should actually set the uniforms
  setUniforms(uniforms = {}) {
    checkUniformValues(uniforms, this.id);
    Object.assign(this.uniforms, uniforms);
    this.setNeedsRedraw();
    return this;
  }

  // TODO - uniform names are too strongly linked camera <=> default shaders
  // At least all special handling is collected here.
  addViewUniforms(uniforms) {
    // TODO - special treatment of these parameters should be removed
    const {camera, viewMatrix, modelMatrix} = uniforms;
    // Camera exposes uniforms that can be used directly in shaders
    const cameraUniforms = camera ? camera.getUniforms() : {};

    const viewUniforms = viewMatrix ?
      this.getCoordinateUniforms(viewMatrix, modelMatrix) : {};

    return Object.assign({}, uniforms, cameraUniforms, viewUniforms);
  }

  draw({
    uniforms = {},
    attributes = {},
    samplers = {},
    settings = {},
    framebuffer = null
  } = {}) {
    const {program: {gl}} = this;
    if (framebuffer) {
      settings = Object.assign(settings, {framebuffer});
    }
    return withParameters(gl, settings,
      () => this.render(uniforms, attributes, samplers)
    );
  }

  render(uniforms = {}, attributes = {}, settings = {}, samplers = {}) {
    if (window.__SEER_INITIALIZED__) {
      addModel(this);
    }

    const resolvedUniforms = this.addViewUniforms(uniforms);

    this.setUniforms(resolvedUniforms);

    log.log(2, `>>> RENDERING MODEL ${this.id}`, this);

    this.setProgramState();

    this._logAttributesAndUniforms(3, resolvedUniforms);

    this.onBeforeRender();

    const drawParams = this.drawParams;
    if (drawParams.isInstanced && !this.isInstanced) {
      log.warn(0, 'Found instanced attributes on non-instanced model');
    }
    const {isIndexed, indexType} = drawParams;
    const {isInstanced, instanceCount} = this;

    this._timerQueryStart();

    this.program.draw({
      drawMode: this.getDrawMode(),
      vertexCount: this.getVertexCount(),
      isIndexed,
      indexType,
      isInstanced,
      instanceCount
    });

    this._timerQueryEnd();

    this.onAfterRender();

    this.unsetProgramState();

    this.setNeedsRedraw(false);

    log.log(2, `<<< RENDERING MODEL ${this.id} - complete`);

    return this;
  }

  setProgramState() {
    const {program} = this;
    program.use();
    this.drawParams = {};
    program.setBuffers(this.buffers, {drawParams: this.drawParams});
    program.setUniforms(this.uniforms, this.samplers);
    return this;
  }

  unsetProgramState() {
    // Ensures all vertex attributes are disabled and ELEMENT_ARRAY_BUFFER
    // is unbound
    this.program.unsetBuffers();
    return this;
  }

  // PROFILING - TODO - rebuild using Query class
  _timerQueryStart() {
    if (this.timerQueryEnabled === true && this.lastQueryReturned === true) {
      this.program.gl.getParameter(this.ext.GPU_DISJOINT_EXT);
      this.timeElapsedQuery = this.ext.createQueryEXT();
      this.ext.beginQueryEXT(this.ext.TIME_ELAPSED_EXT, this.timeElapsedQuery);
    }
  }

  _timerQueryEnd() {
    if (this.timerQueryEnabled === true) {
      if (this.lastQueryReturned === true) {
        this.ext.endQueryEXT(this.ext.TIME_ELAPSED_EXT);
        this.profileFrameCount++;
        this.lastQueryReturned = false;
      }
      // ...at some point in the future, after returning control to the browser
      // and being called again:
      const disjoint = this.program.gl.getParameter(this.ext.GPU_DISJOINT_EXT);
      if (disjoint) {
        this.lastQueryReturned = true;
        // Have to redo all of the measurements.
      } else {
        const available = this.ext.getQueryObjectEXT(this.timeElapsedQuery,
          this.ext.QUERY_RESULT_AVAILABLE_EXT);

        if (available) {
          const timeElapsed = this.ext.getQueryObjectEXT(this.timeElapsedQuery,
            this.ext.QUERY_RESULT_EXT) / 1e6;
          this.lastQueryReturned = true;

          // Do something useful with the time.  Note that care should be
          // taken to use all significant bits of the result, not just the
          // least significant 32 bits.

          // Update stats (e.g. for seer)
          this.stats.lastFrameTime = timeElapsed;
          this.stats.accumulatedTimeFrame += timeElapsed;
          this.stats.averageFrameTime =
            this.stats.accumulatedFrameTime / this.stats.profileFrameCount;

          // Log stats
          log.log(2, 'program.id: ', this.program.id);
          log.log(2, `last frame time: ${this.stats.lastFrameTime}ms`);
          log.log(2, `average frame time ${this.stats.averageFrameTime}ms`);
          log.log(2, `accumulated frame time: ${this.stats.accumulatedFrameTime}ms`);
          log.log(2, `profile frame count: ${this.stats.profileFrameCount}`);
        }
      }
    }
  }

  // Makes sure buffers are created for all attributes
  // and that the program is updated with those buffers
  // TODO - do we need the separation between "attributes" and "buffers"
  // couldn't apps just create buffers directly?
  _createBuffersFromAttributeDescriptors(attributes) {
    const {program: {gl}} = this;

    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];

      if (attribute instanceof Buffer) {
        this.buffers[attributeName] = attribute;
      } else {
        // Autocreate a buffer
        this.buffers[attributeName] =
          this.buffers[attributeName] || new Buffer(gl, {
            target: attribute.isIndexed ? GL.ELEMENT_ARRAY_BUFFER : GL.ARRAY_BUFFER
          });

        const buffer = this.buffers[attributeName];
        buffer
          .setData({data: attribute.value})
          .setDataLayout(attribute);
      }
    }

    return this;
  }

  _logAttributesAndUniforms(priority = 3, uniforms = {}) {
    if (log.priority >= priority) {
      const attributeTable = this._getAttributesTable({
        header: `Attributes ${this.id}`,
        program: this.program,
        attributes: Object.assign({}, this.geometry.attributes, this.attributes)
      });
      log.table(priority, attributeTable);

      const {table, unusedTable, unusedCount} = getUniformsTable({
        header: `Uniforms ${this.id}`,
        program: this.program,
        uniforms: Object.assign({}, this.uniforms, uniforms)
      });

      log.table(priority, table);
      log.log(priority, `${unusedCount || 'No'} unused uniforms `, unusedTable);
    }

    if (window.__SEER_INITIALIZED__) {
      const uniformsObject = Object.assign({}, this.uniforms, uniforms);
      seer.indexedListItem('luma.gl', this.id, uniformsObject);
    }
  }

  // Todo move to attributes manager
  _getAttributesTable({
    attributes,
    header = 'Attributes',
    instanced,
    program
  } = {}) {
    assert(program);
    const attributeLocations = program._attributeLocations;
    const table = {[header]: {}};

    // Add used attributes
    for (const attributeName in attributeLocations) {
      const attribute = attributes[attributeName];
      const location = attributeLocations[attributeName];
      table[attributeName] = this._getAttributeEntry(attribute, location);
    }

    // Add any unused attributes
    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      if (!table[attributeName]) {
        table[attributeName] = this._getAttributeEntry(attribute, null);
      }
    }

    return table;
  }

  _getAttributeEntry(attribute, location) {
    const round = num => Math.round(num * 10) / 10;

    let type = 'NOT PROVIDED';
    let instanced = 0;
    let size = 'N/A';
    let verts = 'N/A';
    let bytes = 'N/A';
    let value = 'N/A';

    if (attribute && location === null) {
      location = attribute.isIndexed ? 'ELEMENT_ARRAY_BUFFER' : 'NOT USED';
    }

    if (attribute instanceof Buffer) {
      const buffer = attribute;
      type = buffer.layout.type;
      instanced = buffer.layout.instanced;
      size = buffer.layout.size;
      verts = round(buffer.data.length / buffer.layout.size);
      bytes = buffer.data.length * buffer.data.BYTES_PER_ELEMENT;
    } else if (attribute) {
      type = attribute.value.constructor.name;
      instanced = attribute.instanced;
      size = attribute.size;
      verts = round(attribute.value.length / attribute.size);
      bytes = attribute.value.length * attribute.value.BYTES_PER_ELEMENT;
      value = attribute.value;
    }

    // Generate a type name by dropping Array from Float32Array etc.
    type = String(type).replace('Array', '');
    // Look for 'nt' to detect integer types, e.g. Int32Array, Uint32Array
    const isInteger = type.indexOf('nt') !== -1;

    return {
      Location: `${location}${instanced ? ' [instanced]' : ''}`,
      'Type Size x Verts = Bytes': `${type} ${size} x ${verts} = ${bytes}`,
      Value: formatValue(value, {size, isInteger})
    };
  }

  // DEPRECATED / REMOVED
  isPickable() {
    return this.pickable;
  }

  setPickable(pickable = true) {
    this.pickable = Boolean(pickable);
    return this;
  }

  getGeometry() {
    return this.geometry;
  }
}
