export interface PlatformInfo {
  name: string;
  baseUrl: string;
  topicMapping: Record<string, string>;
}

export const platforms: Record<string, PlatformInfo> = {
  leetcode: {
    name: "LeetCode",
    baseUrl: "leetcode.com",
    topicMapping: {
      array: "Arrays",
      string: "Strings",
      "hash-table": "Hash Table",
      "dynamic-programming": "Dynamic Programming",
      math: "Math",
      sorting: "Sorting",
      greedy: "Greedy",
      "depth-first-search": "DFS",
      "breadth-first-search": "BFS",
      "binary-search": "Binary Search",
      tree: "Trees",
      "binary-tree": "Binary Tree",
      "linked-list": "Linked List",
      stack: "Stack",
      queue: "Queue",
      heap: "Heap",
      graph: "Graphs",
      backtracking: "Backtracking",
      trie: "Trie",
      design: "System Design",
      "bit-manipulation": "Bit Manipulation",
      "sliding-window": "Sliding Window",
      "two-pointers": "Two Pointers",
      recursion: "Recursion",
      "divide-and-conquer": "Divide and Conquer",
      "union-find": "Union Find",
      "topological-sort": "Topological Sort",
    },
  },
  naukri: {
    name: "Naukri Code 360",
    baseUrl: "naukri.com",
    topicMapping: {
      arrays: "Arrays",
      strings: "Strings",
      "linked-list": "Linked List",
      "binary-tree": "Binary Tree",
      "binary-search-tree": "BST",
      stack: "Stack",
      queue: "Queue",
      heap: "Heap",
      hashing: "Hash Table",
      "dynamic-programming": "Dynamic Programming",
      recursion: "Recursion",
      backtracking: "Backtracking",
      graphs: "Graphs",
      greedy: "Greedy",
      "bit-manipulation": "Bit Manipulation",
      "two-pointers": "Two Pointers",
      "sliding-window": "Sliding Window",
      sorting: "Sorting",
      searching: "Binary Search",
      "number-theory": "Math",
      combinatorics: "Math",
      "divide-and-conquer": "Divide and Conquer",
      trie: "Trie",
    },
  },
  codingninjas: {
    name: "Coding Ninjas",
    baseUrl: "codingninjas.com",
    topicMapping: {
      arrays: "Arrays",
      strings: "Strings",
      "linked-list": "Linked List",
      "binary-tree": "Binary Tree",
      "binary-search-tree": "BST",
      stack: "Stack",
      queue: "Queue",
      heap: "Heap",
      hashing: "Hash Table",
      "dynamic-programming": "Dynamic Programming",
      recursion: "Recursion",
      backtracking: "Backtracking",
      graphs: "Graphs",
      greedy: "Greedy",
      "bit-manipulation": "Bit Manipulation",
      "two-pointers": "Two Pointers",
      "sliding-window": "Sliding Window",
      sorting: "Sorting",
      searching: "Binary Search",
      "number-theory": "Math",
      combinatorics: "Math",
      "divide-and-conquer": "Divide and Conquer",
      trie: "Trie",
    },
  },
  geeksforgeeks: {
    name: "GeeksforGeeks",
    baseUrl: "geeksforgeeks.org",
    topicMapping: {
      arrays: "Arrays",
      strings: "Strings",
      linkedlist: "Linked List",
      tree: "Binary Tree",
      bst: "BST",
      stack: "Stack",
      queue: "Queue",
      heap: "Heap",
      hash: "Hash Table",
      dp: "Dynamic Programming",
      recursion: "Recursion",
      backtracking: "Backtracking",
      graph: "Graphs",
      greedy: "Greedy",
      bit: "Bit Manipulation",
      "two-pointer": "Two Pointers",
      sliding: "Sliding Window",
      sorting: "Sorting",
      searching: "Binary Search",
      math: "Math",
      divide: "Divide and Conquer",
      trie: "Trie",
      design: "System Design",
    },
  },
};

export function detectPlatform(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    for (const [key, platform] of Object.entries(platforms)) {
      if (hostname.includes(platform.baseUrl)) {
        return key;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function extractProblemId(url: string, platform: string): string | null {
  try {
    const urlObj = new URL(url);

    switch (platform) {
      case "leetcode":
        // Enhanced LeetCode URL patterns
        const leetcodeMatch =
          urlObj.pathname.match(/\/problems\/([^/?]+)/) ||
          urlObj.pathname.match(/\/contest\/[^/]+\/problems\/([^/?]+)/);
        return leetcodeMatch ? leetcodeMatch[1] : null;

      case "naukri":
        // Enhanced Naukri patterns
        const naukriMatch =
          urlObj.pathname.match(/\/problems?\/([^/?]+)/) ||
          urlObj.pathname.match(/\/problem\/details\/([^/?]+)/);
        return naukriMatch ? naukriMatch[1] : null;

      case "codingninjas":
        // Enhanced Coding Ninjas patterns
        const codingNinjasMatch =
          urlObj.pathname.match(/\/problems?\/([^/?]+)/) ||
          urlObj.pathname.match(/\/problem\/([^/?]+)/) ||
          urlObj.pathname.match(/\/studio\/problems\/([^/?]+)/);
        return codingNinjasMatch ? codingNinjasMatch[1] : null;

      case "geeksforgeeks":
        // GeeksforGeeks URLs: /problems/problem-name/... or direct articles
        const gfgMatch =
          urlObj.pathname.match(/\/problems\/([^/]+)/) ||
          urlObj.pathname.match(/\/([^/]+)\/?$/); // fallback for article-style
        return gfgMatch ? gfgMatch[1] : null;

      default:
        return null;
    }
  } catch {
    return null;
  }
}

export interface AutoFetchResult {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  platform: string;
}

// Mock auto-fetch function (in a real app, this would make API calls)
export async function autoFetchProblemDetails(
  url: string
): Promise<AutoFetchResult | null> {
  console.log("[v0] Starting auto-fetch for URL:", url);

  const platform = detectPlatform(url);
  console.log("[v0] Detected platform:", platform);

  if (!platform) return null;

  const problemId = extractProblemId(url, platform);
  console.log("[v0] Extracted problem ID:", problemId);

  if (!problemId) return null;

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const platformInfo = platforms[platform];

  function detectTopicFromProblemId(id: string, platformKey: string): string {
    const topicMapping = platforms[platformKey].topicMapping;

    // Check for direct topic matches in problem ID
    for (const [key, value] of Object.entries(topicMapping)) {
      if (id.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    // Enhanced keyword-based detection
    const keywordMap: Record<string, string> = {
      array: "Arrays",
      string: "Strings",
      tree: "Binary Tree",
      linked: "Linked List",
      list: "Linked List",
      stack: "Stack",
      queue: "Queue",
      hash: "Hash Table",
      map: "Hash Table",
      sort: "Sorting",
      search: "Binary Search",
      binary: "Binary Search",
      graph: "Graphs",
      dp: "Dynamic Programming",
      dynamic: "Dynamic Programming",
      greedy: "Greedy",
      "two-pointer": "Two Pointers",
      sliding: "Sliding Window",
      window: "Sliding Window",
      backtrack: "Backtracking",
      dfs: "DFS",
      bfs: "BFS",
      trie: "Trie",
      heap: "Heap",
      priority: "Heap",
      bit: "Bit Manipulation",
      math: "Math",
      number: "Math",
      palindrome: "Strings",
      anagram: "Hash Table",
      parentheses: "Stack",
      bracket: "Stack",
      cycle: "Two Pointers",
      duplicate: "Hash Table",
      median: "Binary Search",
      kth: "Heap",
      longest: "Sliding Window",
      maximum: "Dynamic Programming",
      minimum: "Dynamic Programming",
      subarray: "Arrays",
      substring: "Strings",
      subsequence: "Dynamic Programming",
      path: "Graphs",
      island: "DFS",
      matrix: "Arrays",
      rotate: "Arrays",
      reverse: "Two Pointers",
      merge: "Two Pointers",
      intersection: "Hash Table",
      union: "Union Find",
      diameter: "Binary Tree",
      depth: "Binary Tree",
      level: "BFS",
      order: "BFS",
      traversal: "Binary Tree",
      serialize: "Binary Tree",
      clone: "Graphs",
      word: "Trie",
      ladder: "BFS",
      edit: "Dynamic Programming",
      distance: "Dynamic Programming",
      coin: "Dynamic Programming",
      stock: "Dynamic Programming",
      house: "Dynamic Programming",
      rob: "Dynamic Programming",
      climb: "Dynamic Programming",
      jump: "Dynamic Programming",
      decode: "Dynamic Programming",
      partition: "Dynamic Programming",
      valid: "Stack",
      balanced: "Stack",
      missing: "Arrays",
      first: "Arrays",
      last: "Arrays",
      peak: "Binary Search",
      target: "Binary Search",
      sum: "Arrays",
      product: "Arrays",
      frequency: "Hash Table",
      count: "Hash Table",
      group: "Hash Table",
      top: "Heap",
      kth: "Heap",
      closest: "Heap",
      meeting: "Greedy",
      interval: "Greedy",
      gas: "Greedy",
      candy: "Greedy",
      container: "Two Pointers",
      water: "Two Pointers",
      rain: "Stack",
      trap: "Stack",
    };

    // Check keywords in problem ID
    for (const [keyword, topic] of Object.entries(keywordMap)) {
      if (id.toLowerCase().includes(keyword)) {
        return topic;
      }
    }

    const platformDefaults: Record<string, string> = {
      leetcode: "Arrays",
      naukri: "Data Structures",
      codingninjas: "Data Structures",
      geeksforgeeks: "Data Structures", // 👈 added
    };

    return platformDefaults[platformKey] || "Algorithms";
  }

  // Enhanced mock problems with better topic detection
  const mockProblems: Record<string, Partial<AutoFetchResult>> = {
    "two-sum": { title: "Two Sum", difficulty: "Easy", topic: "Arrays" },
    "add-two-numbers": {
      title: "Add Two Numbers",
      difficulty: "Medium",
      topic: "Linked List",
    },
    "longest-substring-without-repeating-characters": {
      title: "Longest Substring Without Repeating Characters",
      difficulty: "Medium",
      topic: "Sliding Window",
    },
    "median-of-two-sorted-arrays": {
      title: "Median of Two Sorted Arrays",
      difficulty: "Hard",
      topic: "Binary Search",
    },
    "reverse-linked-list": {
      title: "Reverse Linked List",
      difficulty: "Easy",
      topic: "Linked List",
    },
    "binary-tree-inorder-traversal": {
      title: "Binary Tree Inorder Traversal",
      difficulty: "Easy",
      topic: "Binary Tree",
    },
    "maximum-subarray": {
      title: "Maximum Subarray",
      difficulty: "Medium",
      topic: "Dynamic Programming",
    },
    "valid-parentheses": {
      title: "Valid Parentheses",
      difficulty: "Easy",
      topic: "Stack",
    },
    "merge-two-sorted-lists": {
      title: "Merge Two Sorted Lists",
      difficulty: "Easy",
      topic: "Linked List",
    },
    "climbing-stairs": {
      title: "Climbing Stairs",
      difficulty: "Easy",
      topic: "Dynamic Programming",
    },
    "best-time-to-buy-and-sell-stock": {
      title: "Best Time to Buy and Sell Stock",
      difficulty: "Easy",
      topic: "Dynamic Programming",
    },
    "valid-anagram": {
      title: "Valid Anagram",
      difficulty: "Easy",
      topic: "Hash Table",
    },
    "binary-search": {
      title: "Binary Search",
      difficulty: "Easy",
      topic: "Binary Search",
    },
    "flood-fill": { title: "Flood Fill", difficulty: "Easy", topic: "DFS" },
    "lowest-common-ancestor-of-a-binary-search-tree": {
      title: "Lowest Common Ancestor of a BST",
      difficulty: "Medium",
      topic: "Binary Tree",
    },
    "balanced-binary-tree": {
      title: "Balanced Binary Tree",
      difficulty: "Easy",
      topic: "Binary Tree",
    },
    "linked-list-cycle": {
      title: "Linked List Cycle",
      difficulty: "Easy",
      topic: "Two Pointers",
    },
    "implement-queue-using-stacks": {
      title: "Implement Queue using Stacks",
      difficulty: "Easy",
      topic: "Stack",
    },
    "check-if-array-is-sorted-and-rotated": {
      title: "Check if Array Is Sorted and Rotated",
      difficulty: "Easy",
      topic: "Arrays",
    },
  };

  const mockData = mockProblems[problemId] || {
    title: `${problemId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")}`,
    difficulty: "Medium" as const,
    topic: detectTopicFromProblemId(problemId, platform),
  };

  const result = {
    ...mockData,
    platform: platformInfo.name,
  } as AutoFetchResult;

  console.log("[v0] Auto-fetch result:", result);
  return result;
}
