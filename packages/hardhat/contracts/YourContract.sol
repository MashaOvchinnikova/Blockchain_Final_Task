//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
// import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * Смарт контракт платформы для продажи цифровых произведений искусства
 */
contract YourContract {
    address public contractOwner;
    string public greeting = "Welcome to the digital art sales platform!!!";

    struct Artwork {
        string title;
        string description;
        string author;
        uint256 price;
        address owner;
        bool forSale;
        bool sold;
    }
    
    mapping(uint256 => Artwork) public artworks;
    uint public artworkCount;
    
    event ArtworkUploaded(string title, string description, string author, uint256 price, address owner);
    event ArtworkSold(uint256 id, address buyer);
    
    modifier isOwner() {
        // msg.sender: predefined variable that represents address of the account that called the current function
        require(msg.sender == contractOwner, "Not the Owner");
        _;
    }

    constructor(address _owner) {
        contractOwner = _owner;
        artworkCount = 0;
    }
    
    function uploadArtwork(string memory title, string memory description, 
        string memory author, uint256 price) public {
        artworkCount++;
        artworks[artworkCount] = Artwork(title, description, author, price, msg.sender, true, false);
        emit ArtworkUploaded(title, description, author, price, msg.sender);
    }
    
    function buyArtwork(uint256 _id) public payable {
        Artwork storage artwork = artworks[_id];
        require(!artwork.sold, "Artwork already sold");
        require(artwork.owner != msg.sender, "You can't buy your own artwork");
        require(msg.value >= artwork.price, "You don't have enough Ether to purchase this artwork");
        
        address payable seller = payable(artwork.owner);
        seller.transfer(msg.value);
        
        artwork.owner = msg.sender;
        artwork.sold = true;
        
        emit ArtworkSold(_id, msg.sender);
    }
    

    function getArtwork(uint _id) public view returns (Artwork memory) {
        return artworks[_id];
    }

    function getAllArtworks() public view returns (Artwork[] memory) {
        Artwork[] memory artworkList = new Artwork[](artworkCount);
        for (uint i = 1; i <= artworkCount; i++) {
            artworkList[i - 1] = artworks[i];
        }
        return artworkList;
    }

    /**
     * Function that allows the owner to withdraw all the Ether in the contract
     * The function can only be called by the owner of the contract as defined by the isOwner modifier
     */
    function withdraw() public isOwner {
        (bool success, ) = contractOwner.call{ value: address(this).balance }("");
        require(success, "Failed to send Ether");
    }

    /**
     * Function that allows the contract to receive ETH
     */
    receive() external payable {}
}
