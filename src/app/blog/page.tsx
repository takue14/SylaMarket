import BlogPostCard from '@/components/BlogPostCard';

type BlogPost = {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
};

const mockPosts: BlogPost[] = [
  { id: 1, title: 'Top Gadgets 2025', excerpt: 'Explore the latest...', category: 'Tech', date: '2025-09-01' },
  { id: 2, title: 'Home Essentials Guide', excerpt: 'Must-haves for home...', category: 'Home', date: '2025-08-15' },
  // Add more
];

export default function Blog() {
  return (
    <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem',border:'1px var(--boarder)' }}>
      <h1 style={{color:'var(--text-primary)'}}>Blog</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {mockPosts.map(post => <BlogPostCard key={post.id} post={post} />)}
      </div>
    </main>
  );
}