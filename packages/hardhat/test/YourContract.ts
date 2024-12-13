import { expect } from "chai";
import { ethers } from "hardhat";
import { YourContract } from "../typechain-types";

describe("YourContract", function () {
  // We define a fixture to reuse the same setup in every test.

  let artMarketplace: YourContract;
  let contractOwner: any;
  let addr1: any;
  before(async () => {
    [contractOwner, addr1] = await ethers.getSigners();
    const yourContractFactory = await ethers.getContractFactory("YourContract");
    artMarketplace = (await yourContractFactory.deploy(contractOwner.address)) as YourContract;
    await artMarketplace.waitForDeployment();
  });

  describe("ArtMarketplace", function () {
    it("Should have the right message on deploy", async function () {
      expect(await artMarketplace.greeting()).to.equal("Welcome to the digital art sales platform!!!");
    });

    it("Should upload a new artwork", async function () {
      await artMarketplace.uploadArtwork("Mona Lisa", "Famous painting", "Leonardo da Vinci", ethers.parseEther("1"));
      const artwork = await artMarketplace.getArtwork(1);
      expect(artwork.title).to.equal("Mona Lisa");
      expect(artwork.description).to.equal("Famous painting");
      expect(artwork.author).to.equal("Leonardo da Vinci");
      expect(artwork.price).to.equal(ethers.parseEther("1"));
      expect(artwork.owner).to.equal(contractOwner.address);
      expect(artwork.sold).to.equal(false);
    });

    it("Should allow user to buy artwork", async function () {
      const buyer = artMarketplace.connect(addr1);
      await buyer.buyArtwork(1, { value: ethers.parseEther("1") });
      const artwork = await artMarketplace.getArtwork(1);
      expect(artwork.owner).to.equal(addr1);
      expect(artwork.sold).to.equal(true);
    });

    it("Should not allow to buy artwork if not enough Ether is sent", async function () {
      await artMarketplace.uploadArtwork("Starry Night", "Famous painting", "Vincent Van Gogh", ethers.parseEther("1"));
      const buyer = artMarketplace.connect(addr1);
      await expect(buyer.buyArtwork(2, { value: ethers.parseEther("0.5") })).to.be.revertedWith(
        "You don't have enough Ether to purchase this artwork",
      );
    });

    it("Should not allow to buy artwork if it is already sold", async function () {
      const buyer = artMarketplace.connect(addr1);
      await expect(buyer.buyArtwork(1, { value: ethers.parseEther("1") })).to.be.revertedWith("Artwork already sold");
    });

    it("Should not allow to buy your own artwork", async function () {
      await artMarketplace.uploadArtwork("The Kiss", "Famous painting", "Gustav Klimt", ethers.parseEther("1"));
      await expect(artMarketplace.buyArtwork(3, { value: ethers.parseEther("1") })).to.be.revertedWith(
        "You can't buy your own artwork",
      );
    });
  });
});
