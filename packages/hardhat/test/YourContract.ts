import { expect } from "chai";
import { ethers } from "hardhat";
import { YourContract } from "../typechain-types";

describe("YourContract", function () {
  // We define a fixture to reuse the same setup in every test.

  let artMarketplace: YourContract;
  let contractOwner: any;
  let addr1: any;
  let addr2: any;
  before(async () => {
    [contractOwner, addr1, addr2] = await ethers.getSigners();
    const yourContractFactory = await ethers.getContractFactory("YourContract");
    artMarketplace = (await yourContractFactory.deploy(contractOwner.address)) as YourContract;
    await artMarketplace.waitForDeployment();
  });

  describe("Upload Artwork", function () {
    it("Should upload a new artwork", async function () {
      await artMarketplace.uploadArtwork("Mona Lisa", "Famous painting", "Leonardo da Vinci", ethers.parseEther("1"));
      const artwork = await artMarketplace.getArtwork(1);
      expect(artwork.title).to.equal("Mona Lisa");
      expect(artwork.description).to.equal("Famous painting");
      expect(artwork.author).to.equal("Leonardo da Vinci");
      expect(artwork.price).to.equal(ethers.parseEther("1"));
      expect(artwork.owner).to.equal(contractOwner.address);
      expect(artwork.forSale).to.equal(false);
    });

    it("should not allow uploading the same artwork twice", async function () {
      await expect(
        artMarketplace.uploadArtwork("Mona Lisa", "Famous painting", "Leonardo da Vinci", ethers.parseEther("1"))
      ).to.be.revertedWith("Artwork already uploaded");
    });
  });

  describe("Buy Artwork", function () {
    it("Should allow user to buy artwork", async function () {
      await artMarketplace.setArtworkForSale(1);
      const buyer = artMarketplace.connect(addr1);
      await buyer.buyArtwork(1, { value: ethers.parseEther("1") });
      const artwork = await artMarketplace.getArtwork(1);
      expect(artwork.owner).to.equal(addr1);
      expect(artwork.forSale).to.equal(false);
    });

    it("Should not allow to buy artwork if not enough Ether is sent", async function () {
      await artMarketplace.uploadArtwork("Starry Night", "Famous painting", "Vincent Van Gogh", ethers.parseEther("1"));
      await artMarketplace.setArtworkForSale(2);
      const buyer = artMarketplace.connect(addr1);
      await expect(buyer.buyArtwork(2, { value: ethers.parseEther("0.5") })).to.be.revertedWith(
        "You don't have enough Ether to purchase this artwork",
      );
    });

    it("Should not allow to buy artwork if it is not for sale", async function () {
      const buyer = artMarketplace.connect(addr1);
      await expect(buyer.buyArtwork(1, { value: ethers.parseEther("1") })).to.be.revertedWith("Artwork is not for sale");
    });

    it("Should not allow to buy your own artwork", async function () {
      await artMarketplace.uploadArtwork("The Kiss", "Famous painting", "Gustav Klimt", ethers.parseEther("1"));
      await artMarketplace.setArtworkForSale(3);
      await expect(artMarketplace.buyArtwork(3, { value: ethers.parseEther("1") })).to.be.revertedWith(
        "You can't buy your own artwork",
      );
    });
  });

  describe("Set Artwork for Sale", function () {
    it("should allow the owner to set artwork for sale", async function () {
      await artMarketplace.uploadArtwork("Artwork 1", "Description 1", "Author 1", ethers.parseEther("1"));
      await artMarketplace.setArtworkForSale(4);
      const artwork = await artMarketplace.getArtwork(4);
      expect(artwork.forSale).to.be.true;
    });

    it("should not allow the owner to set artwork for sale if it's already for sale", async function () {
      await artMarketplace.uploadArtwork("Artwork 2", "Description 2", "Author 2", ethers.parseEther("1"));
      await artMarketplace.setArtworkForSale(5);
      await expect(
        artMarketplace.setArtworkForSale(5)).to.be.revertedWith("Artwork is already available for sale");
    });

    it("should not allow non-owners to set artwork for sale", async function () {
      await expect(
          artMarketplace.connect(addr2).setArtworkForSale(4)
      ).to.be.revertedWith("Only owner can set artwork for sale");
    });
});
});
