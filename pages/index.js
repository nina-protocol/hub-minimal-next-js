import React from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import NinaSdk from "@nina-protocol/js-sdk";

const Home = dynamic(() => import("../components/Home"));

const HomePage = (props) => {
  const { hub, release } = props;

  const title = release ? release.metadata.name : hub.hub.data.displayName
  const image = release ? release.metadata.image : hub.hub.data.image
  const description = release ? release.metadata.description : hub.hub.data.description

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content={description}
        />
        <meta name="og:type" content="website" />
        <meta
          name="og:title"
          content={title}
        />
        <meta
          name="og:description"
          content={description}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@ninaprotocol" />
        <meta name="twitter:creator" content="@ninaprotcol" />
        <meta name="twitter:image:type" content="image/png" />
        <meta
          name="twitter:title"
          content={description}
        />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <meta name="og:image" content={image} />
      </Head>
      <Home />
    </>
  );
};

export default HomePage;

export const getServerSideProps = async (context) => {
  try {
    const { query } = context;
    if (!NinaSdk.client.program) {
      await NinaSdk.client.init(
        process.env.NINA_API_ENDPOINT,
        process.env.SOLANA_CLUSTER_URL,
        process.env.NINA_PROGRAM_ID,
      )
    }

    let release = undefined;
    let hub = await NinaSdk.Hub.fetch(process.env.NINA_HUB_ID)

    if (query.r) {
      release = hub.releases.find((r) => r.publicKey === query.r)
    }
    console.log('release', release)
    console.log('hub', hub)
    return {props: {
      release,
      hub,
    }}
  } catch (error) {
    console.warn(error);
    return {props: {}}
  }
};
