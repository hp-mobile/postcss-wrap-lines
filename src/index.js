const postcss = require('postcss');
const lastLineLength = require('./lastLineLength');
const processAtRule = require('./processAtRule');
const processDecl = require('./processDecl');
const processRule = require('./processRule');

const wrapLines = postcss.plugin('postcss-wrap-lines', (opts = {}) => {
  opts = Object.assign(
    {},
    {
      debug: false,
      maxWidth: 32768
    },
    opts
  );

  return css => {
    let currentWidth = 0;
    let parentAtRule = null;
    let parentRule = null;

    css.walk(node => {
      let results = {};

      switch (node.type) {
        case 'atrule':
          results = processAtRule(node, opts, currentWidth);
          ({ currentWidth, parentAtRule } = results);
          break;

        case 'comment':
          currentWidth = lastLineLength(node.toString());
          return;

        case 'decl':
          if (node.parent === parentRule || node.parent.parent === parentAtRule)
            return;

          results = processDecl(node, opts, currentWidth);
          ({ currentWidth } = results);
          break;

        case 'rule':
          if (node.parent === parentAtRule) return;

          results = processRule(node, opts, currentWidth);
          ({ currentWidth, parentRule } = results);
          break;

        default:
          return;
      }

      if (currentWidth > opts.maxWidth) {
        throw node.error(`Max line length exceeded by ${results.widthType}`);
      }

      if (opts.debug) {
        switch (results.widthType) {
          case 'node-fits':
          case 'fits-new-line':
          case 'node-fits-new-line':
          case 'multi-line':
          case 'multi-line-selector':
            console.log(
              currentWidth,
              results.widthType,
              node.type,
              node.toString()
            );
            break;
          case 'definition-fits':
            console.log(
              currentWidth,
              results.widthType,
              node.type,
              `@${node.name}${node.raws.afterName}${node.raws.between}
${node.params}`
            );
            break;
          case 'selector-fits':
          case 'selector-fits-new-line':
            console.log(
              currentWidth,
              results.widthType,
              node.type,
              node.selector
            );
            break;
          default:
            console.log(results.widthType);
            break;
        }
      }
    });
  };
});

module.exports = wrapLines;
