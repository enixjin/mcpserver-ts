const mammoth = require('mammoth');
const TurndownService = require('turndown');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

export const convertWordToMarkdown = async (docxPath: string) => {
    try {
        const result = await mammoth.convertToHtml({ path: docxPath });
        const html = result.value;

        const turndownService = new TurndownService({ headingStyle: 'atx' });
        return turndownService.turndown(html);
    } catch (error) {
        console.error('Error converting document:', error);
    }
}

// convertWordToMarkdown("./UserStory.docx")
// .then(console.log);
