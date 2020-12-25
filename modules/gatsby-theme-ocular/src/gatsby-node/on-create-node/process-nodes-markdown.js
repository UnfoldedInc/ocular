// TODO: fix lint errors in this file
/* eslint-disable */
const path = require('path');
// const moment = require('moment');
// TODO/ib - remove
const _ = require('lodash');
const {log, COLOR} = require('../../utils/log');
const {removeURLPathPrefix} = require('../../utils/links-utils');

function parseToc(queue, entry) {
  // this function returns a node in the TOC that has an entry corresponding to
  // the path of the current markdown node
  while (queue.length) {
    const n = queue.shift();
    if (n.entry === entry) {
      return n;
    }
    (n.chapters || []).forEach(c => queue.push(c));
    (n.entries || []).forEach(e => queue.push(e));
  }
  // entry not found
  return null;
}

// Patches up new markdown nodes
//
module.exports.processNewMarkdownNode = function processNewMarkdownNode(
  {node, actions, getNode},
  ocularOptions,
  docNodes,
  tocNode
) {
  const {createNodeField} = actions;

  const fileNode = getNode(node.parent);
  const parsedFilePath = path.parse(fileNode.relativePath);
  let title;
  if (node.frontmatter) {
    title = node.frontmatter.title;
  }

  let slug;
  if (title) {
    slug = `/${_.kebabCase(title)}`;
  } else if (parsedFilePath.name !== 'index' && parsedFilePath.dir !== '') {
    slug = `/${parsedFilePath.dir}/${parsedFilePath.name}/`;
  } else if (parsedFilePath.dir === '') {
    slug = `/${parsedFilePath.name}/`;
  } else {
    slug = `/${parsedFilePath.dir}/`;
  }

  // Update path
  let relPath = path.relative(ocularOptions.ROOT_FOLDER, node.fileAbsolutePath);

  let basename = path.basename(relPath, '.md');
  basename = path.basename(basename, '.mdx');
  const dirname = path.dirname(relPath);
  relPath = basename === 'README' ? dirname : `${dirname}/${basename}`;

  // Store the path before potentially modifying as we want to keep the HOME_PATH for ToC lookup
  const tocNodePath = relPath;
  
  // remove prefix from the path to set HOME_PATH as root url (index)
  if (ocularOptions.HOME_PATH) {
    relPath = removeURLPathPrefix(relPath, ocularOptions.HOME_PATH);
  }

  createNodeField({node, name: 'path', value: relPath});
  createNodeField({node, name: 'slug', value: relPath});
  node.frontmatter.path = relPath;
  node.frontmatter.title = title || '';

  if (tocNode) {
    // this means toc node has been created. Any markdown file processed beyond this point wouldn't have its info
    // in the toc.
    // but we can inject it afterwards

    // the regular toc node generation process adds the full content of each markdown node to the toc.
    // we don't need as much. The app will only use the title and slug of the corresponding markdown
    // node for each toc entry.

    const nodeToEdit = parseToc([tocNode], tocNodePath);
    if (nodeToEdit) {
      nodeToEdit.childMdx = {
        fields: {
          slug: relPath
        },
        frontmatter: {
          title: node.frontmatter.title
        }
      };
    }
    log.log({priority: 4, color: COLOR.YELLOW}, `putting ${relPath} back in the TOC`)();
  }

  // while toc node isn't created, we can add the docs nodes to docNodes, which is used to add data to the TOC
  docNodes[relPath] = node;
};

module.exports.addSiblingNodes = function addSiblingNodes(createNodeField) {
  // postNodes.sort(
  //   ({ frontmatter: { date: date1 } }, { frontmatter: { date: date2 } }) => {
  //     const dateA = moment(date1, siteConfig.dateFromFormat);
  //     const dateB = moment(date2, siteConfig.dateFromFormat);
  //     if (dateA.isBefore(dateB)) return 1;
  //     if (dateB.isBefore(dateA)) return -1;
  //     return 0;
  //   }
  // );
  // for (let i = 0; i < postNodes.length; i += 1) {
  //   const nextID = i + 1 < postNodes.length ? i + 1 : 0;
  //   const prevID = i - 1 > 0 ? i - 1 : postNodes.length - 1;
  //   const currNode = postNodes[i];
  //   const nextNode = postNodes[nextID];
  //   const prevNode = postNodes[prevID];
  //   createNodeField({
  //     node: currNode,
  //     name: 'nextTitle',
  //     value: nextNode.frontmatter.title
  //   });
  //   createNodeField({
  //     node: currNode,
  //     name: 'nextSlug',
  //     value: nextNode.fields.slug
  //   });
  //   createNodeField({
  //     node: currNode,
  //     name: 'prevTitle',
  //     value: prevNode.frontmatter.title
  //   });
  //   createNodeField({
  //     node: currNode,
  //     name: 'prevSlug',
  //     value: prevNode.fields.slug
  //   });
  // }
};

// Ensure sourceInstanceName (added by gatsby-source-filsystem config options)
// is present on nodes generated by gatsby-transform-remark
function addSourceInstanceName(
  {node, getNode, loadNodeContent, actions, createNodeId, reporter},
  pluginOptions
) {
  const {createNodeField} = actions;

  const parent = getNode(node.parent);

  const sourceInstanceName =
    parent && parent.sourceInstanceName ? parent.sourceInstanceName : 'unknown';

  // Add node field
  createNodeField({
    node,
    name: 'sourceName',
    value: sourceInstanceName
  });

  // console.error('adding', sourceInstanceName, node.fields.sourceInstanceName)

  // if (!parent) {
  //   // Node has already been processed.
  //   console.error('Ocular markdown node has no parent', JSON.stringify(node.parent), JSON.stringify(node.sourceInstanceName), node.relativePath);
  //   return;
  // }

  if (parent) {
    addMissingFrontmatter(node, sourceInstanceName);
  }
}

function addMissingFrontmatter(node, sourceInstanceName) {
  // Populate frontmatter
  if (node.frontmatter) {
    if (node.rawBody) {
      const heading = node.rawBody.match(/^#+ (.*)$/m);
      node.frontmatter.title = heading ? heading[1] : '';
      // console.warn(`Ocular processing doc article '${title}'`);
    }
    node.frontmatter.tags = ['default'];
    node.frontmatter.category = 'docs';
    node.frontmatter.cover = 'cover';
    node.frontmatter.type = sourceInstanceName;
  }
}

module.exports.cleanupMarkdownNode = function cleanupMarkdownNode(
  {node, getNode, loadNodeContent, actions, createNodeId, reporter},
  pluginOptions
) {
  let processed = false;

  if (!processed) {
    switch (node.internal.mediaType) {
      case `text/markdown`:
      case `text/x-markdown`:
        addSourceInstanceName(...arguments);
        processed = true;
        break;

      default:
    }
  }

  // Secondary nodes created by remark
  if (!processed) {
    switch (node.internal.type) {
      case 'MarkdownRemark':
      case 'Markdown':
      case 'Mdx':
        addSourceInstanceName(...arguments);
        processed = true;
        break;

      default:
    }
  }

  // if (!processed) {
  //   if (node.internal.mediaType ==- 'application/json') {
  //   }
  //   if (node.id === 'table-of-contents') {
  //   }
  //   console.warn('Ocular ignoring node',
  //     node.absolutePath, node.internal.mediaType, node.internal.type, node.sourceInstanceName);
  // }
};

/* eslint-enable */
