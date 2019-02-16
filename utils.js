const fetch = require('node-fetch')
const fs = require('fs')

const downloadFile = async (url, extensionId) => {
    try {
        const response = await fetch(url);
        const dest = fs.createWriteStream('./extensions/' + extensionId + '.crx');
        response.body.pipe(dest)
        return
    } catch (error) {
        console.log(error)
    }
}

module.exports = downloadFile