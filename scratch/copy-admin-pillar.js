const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src', 'app', 'admin', 'blogs', 'page.tsx');
const destPath = path.join(__dirname, '..', 'src', 'app', 'admin', 'pillar', 'page.tsx');

// Ensure parent directories exist
fs.mkdirSync(path.dirname(destPath), { recursive: true });

// Read the original file
let code = fs.readFileSync(srcPath, 'utf8');

// Perform replacements to customize for Pillar Guides
code = code.replace(/AdminBlogsPage/g, 'AdminPillarPage');
code = code.replace(/const \[section, setSection\] = useState\(""\);/g, 'const [section, setSection] = useState("Pillar Guides");');
code = code.replace(/setSection\(""\);/g, 'setSection("Pillar Guides");');
code = code.replace(/section: section \|\| null,/g, 'section: "Pillar Guides",');

// Filter the list of blogs to only show Pillar Guides
const oldFilteredBlogs = `  const filteredBlogs = blogs.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );`;

const newFilteredBlogs = `  const filteredBlogs = blogs
    .filter(b => b.section === "Pillar Guides" || b.section === "Pillar Guide")
    .filter(b =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
    );`;

code = code.replace(oldFilteredBlogs, newFilteredBlogs);

// Update section titles and headers from "Articles" and "Blogs" to "Pillar Guides"
code = code.replace(/pageType="blogs"/g, 'pageType="blogs"'); // keep blogs stats
code = code.replace(/Articles List/g, 'Pillar Guides List');
code = code.replace(/Add Article/g, 'Add Pillar Guide');
code = code.replace(/Articles \({filteredBlogs.length}\)/g, 'Pillar Guides ({filteredBlogs.length})');
code = code.replace(/Blog successfully added to publication catalog!/g, 'Pillar Guide successfully added!');
code = code.replace(/Blog details updated successfully!/g, 'Pillar Guide updated successfully!');
code = code.replace(/Delete blog category/g, 'Delete category');

// Enforce activeTab to always be articles (hide Categories tab in the UI)
code = code.replace(/setActiveTab\("categories"\)/g, 'void(0)/* disabled */');
// To make it super clean, let's remove the "Categories" tab button and just show the "Pillar Guides" tab button
code = code.replace(
  `<button\n          type="button"\n          className={\`tab-btn \${activeTab === "categories" ? "active" : ""}\`}\n          onClick={() => setActiveTab("categories")}\n        >\n          Categories (\${categories.length})\n        </button>`,
  ''
);

// Write to the destination path
fs.writeFileSync(destPath, code, 'utf8');
console.log("Admin Pillar page created successfully at src/app/admin/pillar/page.tsx");
