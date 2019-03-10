const fetch = require('node-fetch')
const fs = require('fs')

const downloadFile = async (url, filePath) => {
    try {
        const res = await fetch(url)
        await new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(filePath);
            res.body.pipe(fileStream);
            res.body.on("error", (err) => {
                reject(err);
            });
            fileStream.on("finish", function() {
              resolve();
            });
          });
    } catch (error) {
        console.log(error)
    }
}

module.exports = downloadFile