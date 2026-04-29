interface Post {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
}

interface Props { post: Post; }

export default function BlogPostCard({ post }: Props) {
  return (
    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <small>Category: {post.category} | {post.date}</small>
    </div>
  );
}