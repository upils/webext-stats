const fetch = require("node-fetch");
const downloadFile = require('./utils')
const unzip = require("unzip-crx");
const fs = require('fs');
const rmdir = require('rimraf');
const xlsx = require('node-xlsx');

const baseUrlList = 'https://chrome.google.com/webstore/ajax/item?'


const categories = [
'collection%2Fnew_noteworthy_extensions',
'ext%2F15-by-google',
'ext%2F11-web-development',
'ext%2F22-accessibility',
'ext%2F14-fun',
'ext%2F6-news',
'ext%2F28-photos',
'ext%2F7-productivity',
'ext%2F38-search-tools',
'ext%2F12-shopping',
'ext%2F1-communication',
'ext%2F13-sports',
]

let params = {
'hl': 'en-GB',
'gl': 'FR',
'pv': '20181009',
'mce': 'atf%2Cpii%2Crtr%2Crlb%2Cgtc%2Chcn%2Csvp%2Cwtd%2Cnrp%2Chap%2Cnma%2Cnsp%2Cdpb%2Cc3d%2Cncr%2Cctm%2Cac%2Chot%2Cmac%2Cfcf%2Crma',
'count': '100',
'marquee': 'true',
'category': '',
'sortBy': '0',
'container': 'CHROME',
'_reqid': '162367',
'rt': 'j'
}

const options = {
    method : 'POST',
    headers: {
        // Anonymous cookies. You may want to renew it.
        'cookie': 'NID=158=fPPYc-4A65pWH25puLOy77THxtuY1l5SHmhz2ivLL-ZKeVN4TEbtaQvp8xMhnQ0k2SlpfHL1iuN_sNZ0U4J9Ae1GxWVho_bIEZo-LhWlS8V24Vw7224-CYp-QLfMnSO0MHmAs4F528uKZUr66CcCper-ZcmFRujSjVXl1McvuabVLnZKOdn6X7HriQVNJAHV7AkZNu1Ey4B2q3TYmwp1Z4rRa_syvMO8-ME;',
    },
    body: 'login=&'
}

const buildUrlList = (category) => {
    // Reconstruct params array from object
    console.log(category)
    const paramsArray = []
    params['category'] = category

    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            paramsArray.push(key + '=' + params[key]);
        }
    }

    const urlList = baseUrlList + paramsArray.join('&')

    return urlList
}

const getData = async url => {
    try {
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
    let data = [['Potential Threat', 'Category', 'Name', 'ID', 'Permissions', 'Update URL', 'CSP']]
    for (let category of categories) {
        const urlList = buildUrlList(category)
        console.log(urlList)
        const response = await getData(urlList)
        const cleanResponse = JSON.parse(response.split("\n").slice(1).join("\n"))[0][1]
        const extensions = cleanResponse[1]
        for (let i = 0; i < extensions.length; i++ ) {
            const extensionId = extensions[i][0]
            const name = extensions[i][1]
            // index of detail : 37
            // console.log(extensions[i][37])
            const downloadLink = buildDownloadLink(extensionId)
            try {
                const filePath = './extensions/' + extensionId + '.crx'
                await downloadFile(downloadLink, filePath)
                await unzip(filePath)
                let manifestRaw = fs.readFileSync('./extensions/' + extensionId + '/manifest.json');  
                let manifest = JSON.parse(manifestRaw);
                
                console.log(name)

                let threat = ''
            
                let permissions = []
                if (manifest.permissions) {
                    permissions = manifest.permissions
                    if ((permissions.includes('http://*/') || 
                        permissions.includes('http://*/*') ||
                        permissions.includes('https://*/*') ||
                        permissions.includes('https://*/') ||
                        permissions.includes('*://*/') )
                        && permissions.includes('cookies')) {
                        threat = 'yes'
                    }
                }
                let updateUrl
                if (manifest.update_url) {
                    updateUrl = manifest.update_url
                }
                let contentSecurityPolicy
                if (manifest.content_security_policy) {
                    contentSecurityPolicy = manifest.content_security_policy
                }
                const extensionArray = [threat, category, name, extensionId, permissions, updateUrl, contentSecurityPolicy]
                data.push(extensionArray);

                // Cleaning
                rmdir('./extensions/' + extensionId + '/', (err) => {
                    if (err) throw err;
                })
                fs.unlink(filePath, (err) => {
                    if (err) throw err;
                });
                // console.log(data)
            } catch (error) {
                console.log(error)
            }
        }
    }
    const resultsBuffer = xlsx.build([{name: "Results", data: data}]);
    fs.writeFile('results.xlsx', resultsBuffer, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
      });

} catch (error) {
    console.log(error)
}
})()
