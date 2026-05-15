import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Per-page SEO component.
 * Pass title and description; canonical defaults to the current pathname.
 * Open Graph and Twitter tags are auto-populated from title/description.
 */
export default function SEO({ title, description, path }) {
  const url = path ? `https://inciteu.com${path}` : undefined;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {url && <link rel="canonical" href={url} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {url && <meta property="og:url" content={url} />}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
