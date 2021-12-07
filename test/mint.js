const { ethers } = require('hardhat');
const { expect } = require('chai')
const path = require('path')
const Util = require('./util.js')
const util = new Util()
describe('mint', () => {
  it('single mint', async () => {
    await util.deploy();
    await util.clone(util.deployer.address, "test", "T", {
      placeholder: "ipfs://placeholder",
      supply: 10000,
      base: "ipfs://"
    })
    let tx = await util.token.setInvite(util.all, util._cid, {
      start: 0,
      price: 0,
      limit: 3,
    })
    await tx.wait()

    // Check invite for limit => 3
    let invite = await util.token.invite(util.all)
    expect(invite.limit).to.equal(3)

    // Alice tries to mint 1 => should be able to mint one
    let aliceToken = util.getToken(util.alice)
    tx = await aliceToken.mint({
      key: util.all,
      proof: [],
    }, 1)
    await tx.wait()
    let owner = await util.token.ownerOf(1)
    expect(owner).to.equal(util.alice.address)
  })
  it('multi mint', async () => {
    await util.deploy();
    await util.clone(util.deployer.address, "test", "T", {
      placeholder: "ipfs://placeholder",
      supply: 10000,
      base: "ipfs://"
    })
    let tx = await util.token.setInvite(util.all, util._cid, {
      start: 0,
      price: 0,
      limit: 3,
    })
    await tx.wait()

    // Alice tries to mint 3 tokens => Should work
    let aliceToken = util.getToken(util.alice)
    tx = await aliceToken.mint({
      key: util.all,
      proof: []
    }, 3)
    await tx.wait()
    // token 1, 2, 3 should be owned by alice
    let owner = await util.token.ownerOf(1)
    expect(owner).to.equal(util.alice.address)
    owner = await util.token.ownerOf(2)
    expect(owner).to.equal(util.alice.address)
    owner = await util.token.ownerOf(3)
    expect(owner).to.equal(util.alice.address)

    // token 4 doesn't exist
    tx = util.token.ownerOf(4)
    await expect(tx).to.be.revertedWith("ERC721: owner query for nonexistent token")
  })
  it('cannot mint more than total supply', async () => {
    await util.deploy();
    await util.clone(util.deployer.address, "test", "T", {
      placeholder: "ipfs://placeholder",
      supply: 10,
      base: "ipfs://"
    })
    let tx = await util.token.setInvite(util.all, util._cid, {
      start: 0,
      price: 0,
      limit: 10000,
    })
    await tx.wait()

    // try to mint 11 when the total supply is 10
    tx = util.token.mint({
      key: util.all,
      proof: [],
    }, 11)
    await expect(tx).to.be.revertedWith("sold out")

  })
  it('minting transaction must send the right amount', async () => {
    await util.deploy();
    // not sending money should fail
    await util.clone(util.deployer.address, "test", "T", {
      placeholder: "ipfs://placeholder",
      supply: 10000,
      base: "ipfs://"
    })
    let tx = await util.token.setInvite(util.all, util._cid, {
      start: 0,
      price: "" + Math.pow(10, 18),
      limit: 3,
    })
    await tx.wait()

    // try to mint for free => should fail
    tx = util.token.mint({
      key: util.all,
      proof: [],
    }, 1)
    await expect(tx).to.be.revertedWith("wrong amount")

    // try to mint 1 while paying too much => fail
    tx = util.token.mint({
      account: util.alice.address, 
      key: util.all,
      proof: [],
    }, 1, {
      value: "" + Math.pow(10, 19)
    })
    await expect(tx).to.be.revertedWith("wrong amount")

    // try to mint 1 while paying too little => fail
    tx = util.token.mint({
      key: util.all,
      proof: [],
    }, 1, {
      value: "" + Math.pow(10, 17)
    })
    await expect(tx).to.be.revertedWith("wrong amount")

    // try to mint 1 while paying for 1 => should succeed
    let aliceToken = util.getToken(util.alice)
    tx = await aliceToken.mint({
      key: util.all,
      proof: [],
    }, 1, {
      value: "" + Math.pow(10, 18)
    })
    let owner = await util.token.ownerOf(1)
    expect(owner).to.equal(util.alice.address)
  })
})