import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Mail,
  Search,
  Share2,
} from 'lucide-react';
import { BlogCategory, BlogPost } from '../types';

interface InsightsViewProps {
  blogPosts: BlogPost[];
  initialPostId?: string;
}

const BLOG_CATEGORIES: ('All' | BlogCategory)[] = [
  'All',
  'AI & Technology',
  'Business & Productivity',
  'Sales & Marketing',
  'Automation & Operations',
  'Data & Business Intelligence',
  'Education & AI',
  'Trust, Ethics & the Future',
  'Avichas News',
];

export const InsightsView: React.FC<InsightsViewProps> = ({ blogPosts, initialPostId }) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | BlogCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePostId, setActivePostId] = useState<string | null>(initialPostId || null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const activePost = blogPosts.find((p) => p.id === activePostId) || null;
  const featuredPost = blogPosts.find((p) => p.featured) || blogPosts[0];

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (activePost) {
    const relatedPosts = blogPosts.filter((p) => p.id !== activePost.id).slice(0, 2);

    return (
      <div className="max-w-[1100px] mx-auto px-6 py-12 space-y-10">
        <div className="flex items-center justify-between border-b border-stone-300 pb-4">
          <button
            type="button"
            onClick={() => setActivePostId(null)}
            className="text-sm font-medium text-[#0B1F33] hover:text-[#4778A8] inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Insights & News</span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setCopiedShareLink(true);
              setTimeout(() => setCopiedShareLink(false), 2500);
            }}
            className="text-xs font-medium text-[#0B1F33] border border-stone-300 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 hover:border-[#0B1F33]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedShareLink ? 'Article Link Copied' : 'Share Article'}</span>
          </button>
        </div>

        <article className="bg-white border border-stone-200 rounded-md overflow-hidden">
          <div className="h-72 sm:h-96 overflow-hidden bg-stone-100">
            <img
              src={activePost.imageUrl}
              alt={activePost.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-8 sm:p-12 space-y-6">
            {/* Zero-Pill Metadata Discipline */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 font-mono-tabular">
              <span>{activePost.category}</span>
              <span aria-hidden="true">·</span>
              <span>Published {activePost.publishedAt}</span>
              <span aria-hidden="true">·</span>
              <span>{activePost.readTimeMinutes} min read</span>
              <span aria-hidden="true">·</span>
              <span>
                By {activePost.author} ({activePost.authorRole})
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B1F33] font-editorial leading-tight">
              {activePost.title}
            </h1>

            {/* AI News Sourcing & Attribution Box (Section 10 Requirement) */}
            {activePost.sourceAttribution && (
              <div className="p-4 rounded bg-stone-50 border border-stone-200 text-xs space-y-1 font-mono-tabular">
                <div className="font-semibold text-[#0B1F33]">
                  SOURCED NEWS ATTRIBUTION & HUMAN EDITORIAL VERIFICATION (SECTION 10)
                </div>
                <div className="text-stone-600">
                  Original Source: {activePost.sourceAttribution.sourceName} · Date:{' '}
                  {activePost.sourceAttribution.originalDate}
                </div>
                <div className="text-stone-600">
                  Reviewed Before Publication By: {activePost.sourceAttribution.editorialReviewedBy}
                </div>
                <a
                  href={activePost.sourceAttribution.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4778A8] hover:underline inline-flex items-center gap-1 pt-1"
                >
                  <span>Inspect Reputable Source Reference</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="space-y-4 text-base text-stone-700 leading-relaxed max-w-[70ch]">
              {activePost.content.map((para, index) => (
                <p key={index}>{para}</p>
              ))}
            </div>
          </div>
        </article>

        {/* Related Articles */}
        <div className="space-y-4 pt-6 border-t border-stone-300">
          <h2 className="text-xl font-semibold text-[#0B1F33] font-editorial">Related Avichas Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedPosts.map((rel) => (
              <div
                key={rel.id}
                className="bg-white border border-stone-200 rounded-md p-6 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="text-xs text-stone-500 font-mono-tabular">
                    {rel.category} · {rel.publishedAt}
                  </div>
                  <h3 className="text-lg font-semibold text-[#0B1F33] font-editorial">{rel.title}</h3>
                  <p className="text-xs text-stone-600 line-clamp-2">{rel.excerpt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePostId(rel.id)}
                  className="mt-4 text-xs font-semibold text-[#0B1F33] hover:text-[#B5965A] self-start"
                >
                  Read Article →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-12">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-stone-300 pb-8">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs text-[#4778A8] font-mono-tabular">
            PART I SECTION 10 · INSIGHTS, BUSINESS INTELLIGENCE & REVIEWED AI NEWS COMMENTARY
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B1F33] font-editorial tracking-tight">
            Avichas Insights & Executive Commentary
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            Original Avichas articles and human-reviewed commentary covering AI, business productivity, sales
            operations, data intelligence, and education technology.
          </p>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles or topics..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-stone-300 rounded-md focus:outline-none focus:border-[#0B1F33]"
          />
        </div>
      </div>

      {/* 8 Content Categories Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {BLOG_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#0B1F33] text-white border-[#0B1F33]'
                : 'bg-white text-stone-700 border-stone-300 hover:border-[#0B1F33]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured Article Hero */}
      {featuredPost && selectedCategory === 'All' && !searchQuery && (
        <div className="bg-[#0B1F33] text-white rounded-md overflow-hidden border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="text-xs text-[#C9B58B] font-mono-tabular">
                  FEATURED ARTICLE · {featuredPost.category.toUpperCase()} · {featuredPost.publishedAt}
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold font-editorial leading-snug">
                  {featuredPost.title}
                </h2>
                <p className="text-sm text-stone-300 leading-relaxed">{featuredPost.excerpt}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
                <span className="text-stone-300">
                  By {featuredPost.author} · {featuredPost.readTimeMinutes} min read
                </span>
                <button
                  type="button"
                  onClick={() => setActivePostId(featuredPost.id)}
                  className="px-4 py-2 font-semibold bg-[#C9B58B] text-[#0B1F33] rounded-md hover:bg-[#B5965A]"
                >
                  Read Featured Briefing →
                </button>
              </div>
            </div>
            <div className="lg:col-span-5 min-h-[260px]">
              <img
                src={featuredPost.imageUrl}
                alt={featuredPost.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <article
            key={post.id}
            className="bg-white border border-stone-200 rounded-md overflow-hidden flex flex-col justify-between hover:border-[#0B1F33] transition-colors"
          >
            <div>
              <div className="h-48 overflow-hidden bg-stone-100">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-xs text-stone-500 font-mono-tabular">
                  <span>{post.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{post.publishedAt}</span>
                </div>
                <h3 className="text-xl font-semibold text-[#0B1F33] font-editorial leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">{post.excerpt}</p>
                {post.sourceAttribution && (
                  <div className="text-[11px] text-[#4778A8] font-mono-tabular pt-1">
                    Source Attributed: {post.sourceAttribution.sourceName}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-6 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-500">{post.author}</span>
              <button
                type="button"
                onClick={() => setActivePostId(post.id)}
                className="font-semibold text-[#0B1F33] hover:text-[#B5965A]"
              >
                Read Full Article →
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Optional Newsletter Subscription (Section 10) */}
      <div className="bg-[#EDE7D9] border border-stone-300 rounded-md p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="text-xs font-mono-tabular text-[#0B1F33]">AVICHAS EXECUTIVE BRIEFING NEWSLETTER</div>
          <h3 className="text-xl font-semibold text-[#0B1F33] font-editorial">
            Receive Monthly Insights on Business Intelligence, Sales Automation & School AI
          </h3>
          <p className="text-xs text-[#2E3A44]">
            Zero spam. Configurable notifications aligned with Nigeria Data Protection Act consent standards.
          </p>
        </div>

        {newsletterSubscribed ? (
          <div className="text-xs font-semibold text-emerald-900 bg-emerald-100 border border-emerald-300 px-4 py-2.5 rounded-md">
            Subscribed! You will receive the next Avichas Executive Briefing.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newsletterEmail) setNewsletterSubscribed(true);
            }}
            className="flex w-full md:w-auto gap-2"
          >
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter corporate email..."
              className="px-3.5 py-2 text-xs bg-white border border-stone-300 rounded-md w-full md:w-64"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F33] rounded-md whitespace-nowrap shrink-0"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
