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
        <meta name="Content-Type" content="text/html; charset=UTF-8" />
        <link rel="icon" href="/images/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/logo192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/images/apple-touch-icon.png"
        />
        <link
          rel="shortcut icon"
          type="image/png"
          sizes="32x32"
          href="/images/favicon-32x32.png"
        />
        <link
          rel="shortcut icon"
          type="image/png"
          sizes="16x16"
          href="/images/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          defer
          src="https://www.googletagmanager.com/gtag/js?id=G-VDD58V1D22"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-VDD58V1D22', { page_path: window.location.pathname, app_name: 'nights' });
            `,
          }}
        />
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
    return {props: {
      release,
      hub,
    }}
  } catch (error) {
    console.warn(error);
    return {props: {}}
  }
};
