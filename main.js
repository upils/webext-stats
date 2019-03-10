const fetch = require("node-fetch");
const { URLSearchParams } = require('url');
const { CRXFileParser, checkFileAndParse } = require('./parser')
const downloadFile = require('./utils')
const StreamZip = require('node-stream-zip')

const baseUrlList = 'https://chrome.google.com/webstore/ajax/item?'

const params = {
'hl': 'en',
'gl': 'FR',
'pv': '20181009',
'mce': 'atf%2Cpii%2Crtr%2Crlb%2Cgtc%2Chcn%2Csvp%2Cwtd%2Cnrp%2Chap%2Cnma%2Cnsp%2Cdpb%2Cc3d%2Cncr%2Cctm%2Cac%2Chot%2Cmac%2Cfcf%2Crma%2Cpot%2Cevt%2Cigb',
'count': '96',
'token': '121%405767320',
'category': 'extensions',
'sortBy': '0',
'container': 'CHROME',
'features': '9',
'_reqid': '961501',
'rt': 'j'
}

// Reconstruct params array from object
const paramsArray = []

for (var key in params) {
    if (params.hasOwnProperty(key)) {
        paramsArray.push(key + '=' + params[key]);
    }
}

const urlList = baseUrlList + paramsArray.join('&')

const options = {
    method : 'POST',
    headers: {
        'cookie': 'NID=158=fPPYc-4A65pWH25puLOy77THxtuY1l5SHmhz2ivLL-ZKeVN4TEbtaQvp8xMhnQ0k2SlpfHL1iuN_sNZ0U4J9Ae1GxWVho_bIEZo-LhWlS8V24Vw7224-CYp-QLfMnSO0MHmAs4F528uKZUr66CcCper-ZcmFRujSjVXl1McvuabVLnZKOdn6X7HriQVNJAHV7AkZNu1Ey4B2q3TYmwp1Z4rRa_syvMO8-ME;',
    },
    body: 'login=&'
}

const getData = async url => {
    try {
        console.log(url)
        const response = await fetch(url, options);
        const body = await response.text();
        return body
    } catch (error) {
        console.log(error);
    }
}

const buildDownloadLink = function (extensionId) {
    var baseUrl = 'https://clients2.google.com/service/update2/crx?response=redirect&prodversion=49.0&x=id%3D***%26installsource%3Dondemand%26uc';
    var replacer = '***';
    return baseUrl.replace(replacer, extensionId);
  }

if (typeof Array.prototype.reIndexOf === 'undefined') {
    Array.prototype.reIndexOf = function (rx) {
        for (var i in this) {
            if (this[i] && this[i].toString().match(rx)) {
                return i;
            }
        }
        return -1;
    };
}

// Main function
(async () => {
try {
    const response = await getData(urlList)
    // console.log(response)
    console.log(JSON.parse(response.split("\n").slice(1).join("\n")))
    const cleanResponse = JSON.parse(response.split("\n").slice(1).join("\n"))[1]
    console.log(cleanResponse)
    const extensions = cleanResponse[1]
    for (let i = 0; i < extensions.length; i++ ) {
        const extensionId = extensions[i][0]
        // index of detail : 37
        // console.log(extensions[i][37])
        const downloadLink = buildDownloadLink(extensionId)
        try {
            if (extensionId === 'kkhacajnlbpkdjgomnfknhbbpioiiiep') {
                const filePath = await downloadFile(downloadLink, extensionId)
                const extensionZip = await checkFileAndParse(filePath, extensionId)

                const zip = new StreamZip({
                    file: extensionId+'.zip',
                    storeEntries: true
                });
                
                zip.on('ready', () => {
                    zip.extract('manifest.json', './manifest.json', err => {
                        console.log(err ? 'Extract error' : 'Extracted');
                        zip.close();
                    });
                });
            }
        } catch (error) {
            console.log(error)
        }
    }
} catch (error) {
    console.log(error)
}
})()
