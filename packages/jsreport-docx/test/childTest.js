const should = require('should')
const jsreport = require('@jsreport/jsreport-core')
const fs = require('fs')
const path = require('path')
const { getDocumentsFromDocxBuf } = require('./utils')
const { nodeListToArray } = require('../lib/utils')

describe('docx child', () => {
  let reporter

  beforeEach(() => {
    reporter = jsreport({
      store: {
        provider: 'memory'
      }
    })
      .use(require('../')())
      .use(require('@jsreport/jsreport-handlebars')())
      .use(require('@jsreport/jsreport-assets')())
      .use(jsreport.tests.listeners())
    return reporter.init()
  })

  afterEach(async () => {
    if (reporter) {
      await reporter.close()
    }
  })

  it('child throw error when asset does not exists', async () => {
    return should(reporter.render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: fs.readFileSync(path.join(__dirname, 'child.docx'))
          }
        }
      },
      data: {}
    })).be.rejectedWith(/Asset template\.docx not found/i)
  })

  it('child and simple paragraph', async () => {
    await reporter.documentStore.collection('assets').insert({
      name: 'template.docx',
      content: fs.readFileSync(path.join(__dirname, 'child-text-template.docx'))
    })

    const result = await reporter.render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: fs.readFileSync(path.join(__dirname, 'child.docx'))
          }
        }
      },
      data: {}
    })

    fs.writeFileSync('out.docx', result.content)

    const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(1)

    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

    should(textNodes.length).eql(1)
    should(textNodes[0].textContent).eql('Simple text from template')
  })

  it('child and simple paragraph with existing content', async () => {
    await reporter.documentStore.collection('assets').insert({
      name: 'template.docx',
      content: fs.readFileSync(path.join(__dirname, 'child-text-template.docx'))
    })

    const result = await reporter.render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: fs.readFileSync(path.join(__dirname, 'child-with-existing-content.docx'))
          }
        }
      },
      data: {}
    })

    fs.writeFileSync('out.docx', result.content)

    const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(3)

    const textNodesInParagraph1 = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

    should(textNodesInParagraph1.length).eql(1)
    should(textNodesInParagraph1[0].textContent).eql('Paragraph before')

    const textNodesInParagraph2 = nodeListToArray(paragraphNodes[1].getElementsByTagName('w:t'))

    should(textNodesInParagraph2.length).eql(1)
    should(textNodesInParagraph2[0].textContent).eql('Simple text from template')

    const textNodesInParagraph3 = nodeListToArray(paragraphNodes[2].getElementsByTagName('w:t'))

    should(textNodesInParagraph3.length).eql(1)
    should(textNodesInParagraph3[0].textContent).eql('Paragraph after')
  })

  it('child dynamic (with object parameter)', async () => {
    const base64Template = fs.readFileSync(path.join(__dirname, 'child-text-template.docx')).toString('base64')

    const result = await reporter.render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: fs.readFileSync(path.join(__dirname, 'child-dynamic.docx'))
          }
        },
        helpers: `
          function getDynamicDocxTemplate () {
            return {
              content: "${base64Template}",
              encoding: "base64"
            }
          }
        `
      },
      data: {}
    })

    fs.writeFileSync('out.docx', result.content)

    const [doc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml'])
    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(1)

    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

    should(textNodes.length).eql(1)
    should(textNodes[0].textContent).eql('Simple text from template')
  })

  it('child and simple paragraph in document header', async () => {
    await reporter.documentStore.collection('assets').insert({
      name: 'header-template.docx',
      content: fs.readFileSync(path.join(__dirname, 'child-text-template.docx'))
    })

    const result = await reporter.render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: fs.readFileSync(path.join(__dirname, 'child-header.docx'))
          }
        }
      },
      data: {}
    })

    fs.writeFileSync('out.docx', result.content)

    const [doc, headerDoc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', 'word/header1.xml'])
    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(1)

    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

    should(textNodes.length).eql(1)
    should(textNodes[0].textContent).eql('content')

    const headerParagraphNodes = nodeListToArray(headerDoc.getElementsByTagName('w:p'))

    should(headerParagraphNodes.length).eql(1)

    const textNodesInHeader = nodeListToArray(headerParagraphNodes[0].getElementsByTagName('w:t'))

    should(textNodesInHeader.length).eql(1)
    should(textNodesInHeader[0].textContent).eql('Simple text from template')
  })

  it('child and simple paragraph in document footer', async () => {
    await reporter.documentStore.collection('assets').insert({
      name: 'footer-template.docx',
      content: fs.readFileSync(path.join(__dirname, 'child-text-template.docx'))
    })

    const result = await reporter.render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: fs.readFileSync(path.join(__dirname, 'child-footer.docx'))
          }
        }
      },
      data: {}
    })

    fs.writeFileSync('out.docx', result.content)

    const [doc, footerDoc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', 'word/footer1.xml'])
    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(1)

    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

    should(textNodes.length).eql(1)
    should(textNodes[0].textContent).eql('content')

    const footerParagraphNodes = nodeListToArray(footerDoc.getElementsByTagName('w:p'))

    should(footerParagraphNodes.length).eql(1)

    const textNodesInHeader = nodeListToArray(footerParagraphNodes[0].getElementsByTagName('w:t'))

    should(textNodesInHeader.length).eql(1)
    should(textNodesInHeader[0].textContent).eql('Simple text from template')
  })

  it('child and simple paragraph in document footer', async () => {
    await reporter.documentStore.collection('assets').insert({
      name: 'header-template.docx',
      content: fs.readFileSync(path.join(__dirname, 'child-text-template.docx'))
    })

    await reporter.documentStore.collection('assets').insert({
      name: 'footer-template.docx',
      content: fs.readFileSync(path.join(__dirname, 'child-text-template.docx'))
    })

    const result = await reporter.render({
      template: {
        engine: 'handlebars',
        recipe: 'docx',
        docx: {
          templateAsset: {
            content: fs.readFileSync(path.join(__dirname, 'child-header-footer.docx'))
          }
        }
      },
      data: {}
    })

    fs.writeFileSync('out.docx', result.content)

    const [doc, headerDoc, footerDoc] = await getDocumentsFromDocxBuf(result.content, ['word/document.xml', 'word/header1.xml', 'word/footer1.xml'])
    const paragraphNodes = nodeListToArray(doc.getElementsByTagName('w:p'))

    should(paragraphNodes.length).eql(1)

    const textNodes = nodeListToArray(paragraphNodes[0].getElementsByTagName('w:t'))

    should(textNodes.length).eql(1)
    should(textNodes[0].textContent).eql('content')

    const headerParagraphNodes = nodeListToArray(headerDoc.getElementsByTagName('w:p'))

    should(headerParagraphNodes.length).eql(1)

    const textNodesInFooter = nodeListToArray(headerParagraphNodes[0].getElementsByTagName('w:t'))

    should(textNodesInFooter.length).eql(1)
    should(textNodesInFooter[0].textContent).eql('Simple text from template')

    const footerParagraphNodes = nodeListToArray(footerDoc.getElementsByTagName('w:p'))

    should(footerParagraphNodes.length).eql(1)

    const textNodesInHeader = nodeListToArray(footerParagraphNodes[0].getElementsByTagName('w:t'))

    should(textNodesInHeader.length).eql(1)
    should(textNodesInHeader[0].textContent).eql('Simple text from template')
  })
})
