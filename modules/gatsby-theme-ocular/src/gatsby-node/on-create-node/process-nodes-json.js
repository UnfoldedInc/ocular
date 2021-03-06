const path = require('path');
const {log, COLOR} = require('../../utils/log');
const {removeURLPathPrefix} = require('../../utils/links-utils');
/* eslint-disable no-param-reassign */
let tableOfContents = null;

function processEntry(chapter, entry, docNodes, ocularOptions) {
  if (!entry.entry) {
    // TODO/ib - make probe's log.warn emit color
    // log.warn({color: COLOR.RED}, 'missing entry in chapter', chapter.title, entry)();
    log.log({color: COLOR.RED}, 'missing entry in chapter', chapter.title, entry)();
    return;
  }
  let relPath = entry.entry
    .replace(/^\//, '')
    .replace(/\.[^/.]+$/, '')
    .replace(/\/$/, '')
    .replace('/README', '');
  // remove prefix from the path to set HOME_PATH as root url (index)
  if (ocularOptions.HOME_PATH) {
    relPath = removeURLPathPrefix(relPath, ocularOptions.HOME_PATH);
  }
  const docNode = docNodes[relPath] || null;
  if (!docNode || !docNode.id) {
    // TODO/ib - make probe's log.warn emit color
    log.log(
      {priority: 4, color: COLOR.RED},
      `unmatched toc entry for "${relPath}" ${chapter.title}`,
      docNode
    )();
  } else {
    entry.id = [docNode.id];
    entry.markdown = [docNode.id];
    // note - we don't need to have the entire docNode put in here.
    // the app will only use the fields/slug and frontmatter/title properties.
    entry.childMdx = docNode;
    log.log({color: COLOR.CYAN, priority: 2}, 'doc page', chapter.title, entry.entry)();
  }
}

function traverseTableOfContents(chapters, docNodes, level, ocularOptions) {
  (chapters || []).forEach((chapter) => {
    chapter.level = level;
    if (chapter.chapters) {
      traverseTableOfContents(chapter.chapters, docNodes, level + 1, ocularOptions);
    }
    const entries = chapter.entries || [];
    (entries || []).forEach((entry) => {
      processEntry(chapter, entry, docNodes, ocularOptions);
    });
  });
}

// Patches up new markdown nodes
//
module.exports.processNewDocsJsonNode = function processNewDocsJsonNode(
  {node},
  ocularOptions,
  docNodes
) {
  traverseTableOfContents(node.chapters, docNodes, 1, ocularOptions);
  // merge table of contents
  if (tableOfContents) {
    tableOfContents.chapters = tableOfContents.chapters.concat(node.chapters);
  } else {
    tableOfContents = node;
  }

  log.log(
    {color: COLOR.CYAN, priority: 3},
    `Processing tableOfContents \
${Object.keys(docNodes).length}
${tableOfContents.length}
//${JSON.stringify(Object.keys(docNodes), null, 0)}
`
    // ${JSON.stringify(tableOfContents, null, 0)}
  )(); // , Object.keys(docNodes));
  return tableOfContents;
};
