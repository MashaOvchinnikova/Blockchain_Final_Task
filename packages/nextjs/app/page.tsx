"use client";
import { useEffect, useState } from 'react';
import { useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import styles from '../styles/Home.module.css';
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useDeployedContractInfo, useScaffoldWriteContract } from '~~/hooks/scaffold-eth';


export default function Home() {
  const [artworks, setArtworks] = useState([]);
  const [_userCollection, setUserCollection] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [price, setPrice] = useState('');
  const { address: connectedAddress } = useAccount();

  const { data: deployedContractData } = useDeployedContractInfo("YourContract");

  const { data: awailableArtworks } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getAllArtworks",
  });

  const {data: artworksCollection} = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getUserCollection",
    args: [connectedAddress]
  });

  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract("YourContract");

  useEffect(() => {
    loadArtworks();
    loadUserColletionArtworks();
  });

  const loadArtworks = async () => {
    const artworksArray = await awailableArtworks;
    setArtworks(artworksArray);
  };

  const loadUserColletionArtworks = async () => {
    const collection = artworksCollection;
    setUserCollection(artworksCollection);
  }

  const uploadArtwork = async () => {
    if (!title || !description || !author || !price ) return;
    try {
      await writeYourContractAsync({
        functionName: "uploadArtwork",
        args: [title, description, author, parseEther(price)],
      });
    } catch (e) {
      console.error("Error uploading artwork:", e);
    }
    setTitle('');
    setDescription('');
    setAuthor('');
    setPrice('');
    loadUserColletionArtworks();
    loadArtworks();
  };

  const buyArtwork = async (id: bigint, price: string) => {
    try {
      await writeYourContractAsync({
        functionName: "buyArtwork",
        args: [id],
        value: parseEther(price)
      });
    } catch (e) {
      console.error("Error buying artwork:", e);
    }
    loadUserColletionArtworks();
    loadArtworks();
  };

  const setArtworkForSale = async (id: bigint) => {
    try {
      await writeYourContractAsync({
        functionName: "setArtworkForSale",
        args: [id]
      });
    } catch (e) {
      console.error("Error setting artwork for sale:", e);
    }
    loadUserColletionArtworks();
    loadArtworks();
  };

  return (
    <div className={styles.container}>
      <div className="px-5">
        <h1 className="text-center">
          <span className="block text-2xl mb-2">Welcome to</span>
          <span className="block text-4xl font-bold">Artwork Marketplace</span>
        </h1>
        <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
          <p className="my-2 font-medium">Connected Address:</p>
          <Address address={connectedAddress} />
        </div>
        <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
          <p className="my-2 font-medium">Contract Address:</p>
          <Address address={deployedContractData?.address} />
        </div>
      </div>
      <br></br>
      <div className="px-5">
        <h2 className="text-center">
          <span className="block text-2xl mb-2">Available Artworks</span>
        </h2>
      </div>
      <table className={styles.table}>
        <thead>
            <tr className={styles.tr}>
                <th>Title</th>
                <th>Description</th>
                <th>Author</th>
                <th>Price</th>
                <th>Owner</th>
                <th>For Sale</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody className={styles.tbody}>
            {artworks && artworks.length > 0 ? (
                artworks.map((artwork) => (
                    <tr key={artwork.id.toString()} className={styles.tr}>
                        <td className={styles.td}>{artwork.title}</td>
                        <td className={styles.td}>{artwork.description}</td>
                        <td className={styles.td}>{artwork.author}</td>
                        <td className={styles.td}>{formatEther(artwork.price)} ETH</td>
                        <td className={styles.td}>{artwork.owner}</td>
                        <td className={styles.td}>{artwork.forSale.toString()}</td>
                        <td className={styles.td}>
                            <button className={styles.button} onClick={() => buyArtwork(artwork.id, formatEther(artwork.price))}>
                                Buy
                            </button>
                        </td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={6} className="text-center">No artworks uploaded yet</td>
                </tr>
            )}
        </tbody>
      </table>
      <br></br>
      <div className="px-5">
        <h2 className="text-center">
          <span className="block text-2xl mb-2">Upload Artwork</span>
        </h2>
      </div>
      <hr></hr>
      <input className={styles.input}
        type="text"
        placeholder="Artwork Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input className={styles.input}
        type="text"
        placeholder="Artwork Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input className={styles.input}
        type="text"
        placeholder="Artwork Author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <input className={styles.input}
        type="text"
        placeholder="Price in ETH"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <button className={styles.button} onClick={uploadArtwork}>Upload Artwork</button>
      <hr></hr>
      <br></br>
      <div className="px-5">
        <h2 className="text-center">
          <span className="block text-2xl mb-2">Your Collection</span>
        </h2>
      </div>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tr}>
            <th>Title</th>
            <th>Description</th>
            <th>Author</th>
            <th>Price</th>
            <th>For Sale</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {_userCollection && _userCollection.length > 0 ? (
            _userCollection.map((artwork) => (
              <tr key={artwork.id.toString()} className={styles.tr}>
                <td className={styles.td}>{artwork.title}</td>
                <td className={styles.td}>{artwork.description}</td>
                <td className={styles.td}>{artwork.author}</td>
                <td className={styles.td}>{formatEther(artwork.price)} ETH</td>
                <td className={styles.td}>{artwork.forSale.toString()}</td>
                <td className={styles.td}>
                    <button className={styles.button} onClick={() => setArtworkForSale(artwork.id)}>
                        Set For Sale
                    </button>
                </td>
              </tr>
            ))
          ) : (
              <tr>
                  <td colSpan={6} className="text-center">No artworks in your collection yet</td>
              </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
