const util = require('util')
const fs = require('fs')

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const CRXFileParser = function(fileBuffer) {
    var self = this

    self.fileBuffer = fileBuffer

    this._formatUint32 = function (uint) {
        var s = uint.toString(16);
        while (s.length < 8) {
            s = '0' + s;
        }
        return '0x' + s
    }

    this._formatCharString = function (uint) {
        var s = this._formatUint32(uint)
        s = s.substr(2, 8)
        var o = ''
        for (var i = 0; i < 4; i++) {
            o += String.fromCharCode(parseInt(s.substr(i << 1, 2), 16))
        }
        return o;
    }

    this.parse = function (dataView, arrayBuffer) {
        var magic = dataView.getUint32(0)

        if (magic == 0x43723234) { // Cr24
            console.info('Magic is OK: ' + this._formatUint32(magic) + ' ' + this._formatCharString(magic))
        } else {
            console.error('Magic is broken: ' + this._formatUint32(magic) + ' ' + this._formatCharString(magic))
        return;
        }

        const version = dataView.getUint32(4);
        console.info('Version is: ' + this._formatUint32(version))

        const publicKeyLength = dataView.getUint32(8, true)
        console.info('Public key length: ' + publicKeyLength)

        const signatureLength = dataView.getUint32(12, true)
        console.info('Signature length: ' + signatureLength)

        const publicKeyBuffer = arrayBuffer.slice(16, 16 + publicKeyLength)
        const signatureBuffer = arrayBuffer.slice(16 + publicKeyLength, 16 + publicKeyLength + signatureLength)

        const zipArchiveBuffer = arrayBuffer.slice(16 + publicKeyLength + signatureLength)
        console.log(arrayBuffer.byteLength)

        return [zipArchiveBuffer, publicKeyBuffer, signatureBuffer]
    }

    this.asyncLoad = async function () {
        try {
            const view = new DataView(this.fileBuffer)
            const parsedData = self.parse(view, this.fileBuffer)
            return parsedData
        } catch (error) {
            console.log(error)
        }
    }
}

const checkFileAndParse = async function (filePath) {
    const file = await readFile(filePath)
    const fileBuffer = file.buffer
    const parser = await new CRXFileParser(fileBuffer)
    try {
        const parsingResult = await parser.asyncLoad()
        const zipArchiveBuffer = parsingResult[0]
        const outputFile = Buffer.from(zipArchiveBuffer)
        console.log(outputFile.byteLength)
        await writeFile('test.zip', outputFile)
    }
    catch (error) {
        console.log(error)
    }
}

module.exports = { CRXFileParser, checkFileAndParse }