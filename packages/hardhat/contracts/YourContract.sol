// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

/**
 * Смарт контракт платформы для продажи цифровых произведений искусства
 */
contract YourContract {
    address public contractOwner;
    struct Artwork {
        uint id;
        string title;
        string description;
        string author;
        uint256 price;
        address owner;
        bool forSale;
    }
    
    mapping(uint256 => Artwork) public artworks;
    mapping(address => Artwork[]) public userCollection;
    uint public artworkCount;
    
    event ArtworkUploaded(uint id, string title, string description, string author, uint256 price, address owner);
    event ArtworkSold(uint256 id, address buyer);
    event ArtworkSetUpForSale(uint id);
    event ArtworkAddedToCollection(address user, Artwork artwork);
    
    modifier isOwner() {
        require(msg.sender == contractOwner, "Not the Owner");
        _;
    }

    constructor(address _owner) {
        contractOwner = _owner;
        artworkCount = 0;
    }
    
    function uploadArtwork(string memory title, string memory description, 
        string memory author, uint256 price) public {
        require(!alreadyUploaded(title, description, author), "Artwork already uploaded");
        artworkCount++;
        Artwork memory newArtwork = Artwork(artworkCount, title, description, author, price, msg.sender, false);
        artworks[artworkCount] = newArtwork;
        addArtworkToCollection(msg.sender, newArtwork);
        emit ArtworkUploaded(artworkCount, title, description, author, price, msg.sender);
    }

    function addArtworkToCollection(address user, Artwork memory artwork) internal {
        require(!alreadyInCollection(user, artwork), "User  already has this Artwork in collection");
        userCollection[user].push(artwork);
        emit ArtworkAddedToCollection(user, artwork);
    }

    function alreadyInCollection(address user, Artwork memory artwork) internal view returns (bool) {
        Artwork[] memory userArtworks = userCollection[user];
        for (uint i = 0; i < userArtworks.length; i++) {
            if (keccak256(abi.encodePacked(userArtworks[i].title)) == keccak256(abi.encodePacked(artwork.title)) 
            && keccak256(abi.encodePacked(userArtworks[i].description)) == keccak256(abi.encodePacked(artwork.description))
            && keccak256(abi.encodePacked(userArtworks[i].author)) == keccak256(abi.encodePacked(artwork.author))){
                return true;
            }
        }
        return false;
    }

    function alreadyUploaded(string memory title, string memory description, 
    string memory author) internal view returns (bool) {
        Artwork[] memory _artworks = getAllArtworks();
        for (uint i = 0; i < _artworks.length; i++) {
            if (keccak256(abi.encodePacked(_artworks[i].title)) == keccak256(abi.encodePacked(title)) 
            && keccak256(abi.encodePacked(_artworks[i].description)) == keccak256(abi.encodePacked(description))
            && keccak256(abi.encodePacked(_artworks[i].author)) == keccak256(abi.encodePacked(author))){
                return true;
            }
        }
        return false;
    }
    
    function buyArtwork(uint256 _id) public payable {
        Artwork storage artwork = artworks[_id];
        require(artwork.forSale, "Artwork is not for sale");
        require(artwork.owner != msg.sender, "You can't buy your own artwork");
        require(msg.value >= artwork.price, "You don't have enough Ether to purchase this artwork");
        
        address payable seller = payable(artwork.owner);
        seller.transfer(msg.value);
        
        // Удаляем произведение из коллекции продавца
        removeArtworkFromCollection(artwork.owner, artwork);
        
        artwork.owner = msg.sender;
        artwork.forSale = false;
        addArtworkToCollection(msg.sender, artwork);
        
        emit ArtworkSold(_id, msg.sender);
    }

    function removeArtworkFromCollection(address user, Artwork memory artwork) internal {
        Artwork[] storage userArtworks = userCollection[user];
        for (uint i = 0; i < userArtworks.length; i++) {
            if (keccak256(abi.encodePacked(userArtworks[i].title)) == keccak256(abi.encodePacked(artwork.title))) {
                userArtworks[i] = userArtworks[userArtworks.length - 1]; // Перемещаем последний элемент на место удаляемого
                userArtworks.pop(); // Удаляем последний элемент
                break;
            }
        }
    }

    function setArtworkForSale(uint id) public {
        require(artworks[id].owner == msg.sender, "Only owner can set artwork for sale");
        require(!artworks[id].forSale, "Artwork is already available for sale");

        artworks[id].forSale = true;
        setArtworkInCollectionForSale(msg.sender, artworks[id]);

        emit ArtworkSetUpForSale(id);
    }

    function setArtworkInCollectionForSale(address user, Artwork memory artwork) internal {
        Artwork[] memory _userArtworks = getUserCollection(user);
        for (uint i = 0; i < _userArtworks.length; i++) {
            if (keccak256(abi.encodePacked(_userArtworks[i].title)) == keccak256(abi.encodePacked(artwork.title)) 
            && keccak256(abi.encodePacked(_userArtworks[i].description)) == keccak256(abi.encodePacked(artwork.description))
            && keccak256(abi.encodePacked(_userArtworks[i].author)) == keccak256(abi.encodePacked(artwork.author))){
                userCollection[user][i].forSale = true;
            }
        }
    }
    
    function getArtwork(uint _id) public view returns (Artwork memory) {
        return artworks[_id];
    }

    function getUserCollection(address user) public view returns (Artwork[] memory) {
        return userCollection[user];
    }

    function getAllArtworks() public view returns (Artwork[] memory) {
        Artwork[] memory artworkList = new Artwork[](artworkCount);
        for (uint i = 1; i <= artworkCount; i++) {
            artworkList[i - 1] = artworks[i];
        }
        return artworkList;
    }

    function withdraw() public isOwner {
        uint balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        address payable owner = payable(contractOwner);
        owner.transfer(balance);
    }
}
