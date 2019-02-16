const fetch = require('node-fetch')
const fs = require('fs')

const downloadFile = async (url, extensionId) => {
    try {
        const filePath = './extensions/' + extensionId + '.crx'
        const response = await fetch(url)
        const dest = fs.createWriteStream(filePath)
        response.body.pipe(dest)
        console.log(filePath)
        return filePath
    } catch (error) {
        console.log(error)
    }
}

module.exports = downloadFile