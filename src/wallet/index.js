import { mkdirSync, readFileSync, existsSync, statSync } from "fs"
import { ethers } from 'ethers'
import parse from 'parse-git-config'
import abi from './abi.js'

// path -> /ab/123ab3123
export async function callContractMethod({
  method = 'upload',
  path,
  file,
  sha
}) {
  const wallet = 'default'
  const keyPath = process.env.HOME + "/.git3/keys"
  mkdirSync(keyPath, { recursive: true })

  const content = readFileSync(`${keyPath}/${wallet}`).toString()
  const [walletType, key] = content.split('\n')
  const provider = new ethers.providers.JsonRpcProvider('https://galileo.web3q.io:8545');

  let etherWallet = walletType === 'privateKey'
    ? new ethers.Wallet(key)
    : ethers.Wallet.fromMnemonic(key)

  etherWallet = etherWallet.connect(provider)
  const contract = new ethers.Contract('0xb940B75947F64C9fe0b4B2b6c56Fc9DEF03bBb5F', abi, etherWallet);
  const pathBuffer = path ? Buffer.from(path) : ''

  if (method === 'upload') {
    const uploadResult = await contract.upload(pathBuffer, file)
    console.error(`=== upload file ${path} result ===`)
    console.error(uploadResult)
  }

  if (method === 'download') {
    const res = await contract.download(pathBuffer)
    const buf = Buffer.from(res[0].slice(2), 'hex')

    console.error(`=== download file ${path} result ===`)
    console.error(buf.toString('utf-8'))
    return buf
  }

  if (method === 'setRef') {
    const res = await contract.setRef(path, '0x' + sha)
  }

  if (method === 'listRefs') {
    const res = await contract.listRefs()
    let refs = res.map(i => ({
      ref: i[1],
      sha: i[0].slice(2)
    }))

    // refs = refs.concat([{ ref: 'HEAD', sha: 'refs/heads/main' }])
    return refs
  }
}