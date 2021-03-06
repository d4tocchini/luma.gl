/* eslint-disable */
/* global window, document, ace, LumaGL, console */
window.addEventListener('load', () => {
  var loadFiles = LumaGL.loadFiles;

  const pathname = window.location.pathname;
  const matches = pathname.match(/^\/dist\/lessons\/(.*)\//);
  const N = matches ? matches[1] : '01';

  loadFiles({urls: [
    `/examples/lessons/${N}/index.js`
    // `https://github.com/gpjt/webgl-lessons/blob/master/lesson${N}/index.html`
  ]})
  .then(files => {
    const lumaSrc = files[0];
    // const lessonSrc = files[1];

    // Add the editor div.
    var editorDiv = document.createElement('div');
    editorDiv.className = 'editor';
    editorDiv.style.display = 'none';
    document.body.appendChild(editorDiv);

    // Configure the editor div.
    var editor = ace.edit(editorDiv);
    editor.getSession().setUseWorker(false);
    editor.$blockScrolling = Infinity;
    editor.setTheme('ace/theme/tomorrow');
    editor.getSession().setMode('ace/mode/javascript');
    editor.renderer.setShowGutter(true);
    editor.setShowPrintMargin(false);
    editor.setHighlightActiveLine(false);
    editor.setDisplayIndentGuides(false);
    editor.setValue(lumaSrc);
    editor.setReadOnly(true);
    editor.setFontSize(14);
    editor.getSession().selection.clearSelection();

    // Add the buttons div.
    var div = document.createElement('div');
    div.className = 'buttons';
    document.body.appendChild(div);

    var controlsDiv = document.getElementById('controls');
    controlsDiv.style.display = 'none';

    // Add the editor button.
    var span = document.createElement('span');
    span.className = 'button';
    span.innerHTML =
      '<span class="glyphicon glyphicon-search"></span> Source';
    span.onclick = function() {
      controlsDiv.style.display = 'none';
      if (editorDiv.style.display !== 'none') {
        editorDiv.style.display = 'none';
      } else {
        editorDiv.style.display = 'block';
      }
    };
    div.appendChild(span);

    // Add the controls button.
    if (controlsDiv.innerHTML !== '') {
      span = document.createElement('span');
      span.className = 'button';
      span.innerHTML =
        '<span class="glyphicon glyphicon-cog"></span> Controls';
      span.onclick = function() {
        editorDiv.style.display = 'none';
        if (controlsDiv.style.display !== 'none') {
          controlsDiv.style.display = 'none';
        } else {
          controlsDiv.style.display = 'block';
        }
      };
      div.appendChild(span);
    }

    // Add the prev/next buttons.
    var split = window.location.pathname.split('/');
    var baseurl = split.slice(0, split.length - 2).join('/') + '/';
    var current = parseInt(split[split.length - 2]);
    var prev = current - 1;
    var next = current + 1;

    prev = prev < 10 ? `0${prev}` : `${prev}`;
    next = next < 10 ? `0${next}` : `${next}`;

    if (prev > 0) {
      span = document.createElement('span');
      span.className = 'button';
      span.innerHTML =
        '<a href="' + baseurl + prev + '">' +
        '<span class="glyphicon glyphicon-chevron-left"></span>' +
        ' Previous</a>';
      div.appendChild(span);
    } else {
      span = document.createElement('span');
      span.className = 'button';
      span.innerHTML = '<a href="' + baseurl + 16 + '">' +
        '<span class="glyphicon glyphicon-chevron-left">' +
        '</span> Lesson 16</a>';
      div.appendChild(span);
    }
    span = document.createElement('span');
    span.className = 'button';
    span.innerHTML = '<span style="color:yellow">' +
      'Lesson ' + current + '</span>';
    div.appendChild(span);
    if (next < 17) {
      span = document.createElement('span');
      span.className = 'button';
      span.innerHTML = '<a href="' + baseurl + next + '">' +
        'Next <span class="glyphicon glyphicon-chevron-right"></span></a>';
      div.appendChild(span);
    } else {
      span = document.createElement('span');
      span.className = 'button';
      span.innerHTML = `<a href="${baseurl + 1}">` +
        'Lesson 1 <span class="glyphicon glyphicon-chevron-right"></span>' +
        '</a>';
      div.appendChild(span);
    }
  })
  .catch(error => console.error(`Error loading lesson source: ${error}`));
});
