#!/bin/bash

BASE_URL="http://localhost:3000/questions"

# ========== ARRAYS ==========
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Reverse an Array",
  "description": "Given an array of integers, reverse the array in-place.",
  "difficulty": "easy",
  "topic": "Arrays",
  "test_cases": { "cases": [ { "input": "[1,2,3]", "output": "[3,2,1]" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Find Maximum Element",
  "description": "Return the maximum element in the array.",
  "difficulty": "easy",
  "topic": "Arrays",
  "test_cases": { "cases": [ { "input": "[1,9,3]", "output": "9" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Rotate Array by K",
  "description": "Rotate the array to the right by k steps.",
  "difficulty": "medium",
  "topic": "Arrays",
  "test_cases": { "cases": [ { "input": "[1,2,3,4,5], k=2", "output": "[4,5,1,2,3]" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Maximum Subarray Sum",
  "description": "Find the contiguous subarray with the largest sum (Kadane’s Algorithm).",
  "difficulty": "medium",
  "topic": "Arrays",
  "test_cases": { "cases": [ { "input": "[-2,1,-3,4,-1,2,1,-5,4]", "output": "6" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Trapping Rain Water",
  "description": "Given an elevation map, compute how much water it can trap after raining.",
  "difficulty": "hard",
  "topic": "Arrays",
  "test_cases": { "cases": [ { "input": "[0,1,0,2,1,0,1,3,2,1,2,1]", "output": "6" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Median of Two Sorted Arrays",
  "description": "Find the median of two sorted arrays of size m and n.",
  "difficulty": "hard",
  "topic": "Arrays",
  "test_cases": { "cases": [ { "input": "[1,3], [2]", "output": "2.0" } ] }
}'

# ========== STRINGS ==========
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Reverse a String",
  "description": "Reverse a given string in-place.",
  "difficulty": "easy",
  "topic": "Strings",
  "test_cases": { "cases": [ { "input": "hello", "output": "olleh" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Check Palindrome",
  "description": "Check if a given string is a palindrome.",
  "difficulty": "easy",
  "topic": "Strings",
  "test_cases": { "cases": [ { "input": "racecar", "output": "true" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Longest Substring Without Repeating Characters",
  "description": "Find the length of the longest substring without repeating characters.",
  "difficulty": "medium",
  "topic": "Strings",
  "test_cases": { "cases": [ { "input": "abcabcbb", "output": "3" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Check Anagram",
  "description": "Determine if two strings are anagrams of each other.",
  "difficulty": "medium",
  "topic": "Strings",
  "test_cases": { "cases": [ { "input": "anagram, nagaram", "output": "true" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Regex Match",
  "description": "Implement regular expression matching with support for '.' and '*'.",
  "difficulty": "hard",
  "topic": "Strings",
  "test_cases": { "cases": [ { "input": "s=aa, p=a*", "output": "true" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Word Break",
  "description": "Determine if a string can be segmented into words from a dictionary.",
  "difficulty": "hard",
  "topic": "Strings",
  "test_cases": { "cases": [ { "input": "leetcode, dict=[leet, code]", "output": "true" } ] }
}'

# ========== GRAPHS ==========
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "BFS Traversal",
  "description": "Perform BFS traversal of a graph starting from node 0.",
  "difficulty": "easy",
  "topic": "Graphs",
  "test_cases": { "cases": [ { "input": "graph={0:[1,2],1:[2],2:[3]}", "output": "[0,1,2,3]" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "DFS Traversal",
  "description": "Perform DFS traversal of a graph starting from node 0.",
  "difficulty": "easy",
  "topic": "Graphs",
  "test_cases": { "cases": [ { "input": "graph={0:[1,2],1:[2],2:[3]}", "output": "[0,1,2,3]" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Detect Cycle in Graph",
  "description": "Detect if a graph has a cycle.",
  "difficulty": "medium",
  "topic": "Graphs",
  "test_cases": { "cases": [ { "input": "graph with cycle", "output": "true" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Topological Sort",
  "description": "Return a topological ordering of a DAG.",
  "difficulty": "medium",
  "topic": "Graphs",
  "test_cases": { "cases": [ { "input": "graph={0:[1],1:[2],2:[]}", "output": "[0,1,2]" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Dijkstra Shortest Path",
  "description": "Find shortest paths from source to all vertices using Dijkstra’s algorithm.",
  "difficulty": "hard",
  "topic": "Graphs",
  "test_cases": { "cases": [ { "input": "graph with weights", "output": "shortest distances" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Minimum Spanning Tree",
  "description": "Find the MST of a graph using Kruskal or Prim’s algorithm.",
  "difficulty": "hard",
  "topic": "Graphs",
  "test_cases": { "cases": [ { "input": "graph with weights", "output": "MST edges" } ] }
}'

# ========== DYNAMIC PROGRAMMING ==========
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Fibonacci Numbers",
  "description": "Return the nth Fibonacci number using DP.",
  "difficulty": "easy",
  "topic": "Dynamic Programming",
  "test_cases": { "cases": [ { "input": "n=5", "output": "5" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Climbing Stairs",
  "description": "You can climb 1 or 2 steps at a time. Find how many distinct ways to reach the top.",
  "difficulty": "easy",
  "topic": "Dynamic Programming",
  "test_cases": { "cases": [ { "input": "n=3", "output": "3" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Coin Change",
  "description": "Given coins of different denominations, compute the fewest coins needed to make amount n.",
  "difficulty": "medium",
  "topic": "Dynamic Programming",
  "test_cases": { "cases": [ { "input": "coins=[1,2,5], n=11", "output": "3" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Longest Common Subsequence",
  "description": "Find the length of the longest subsequence common to two strings.",
  "difficulty": "medium",
  "topic": "Dynamic Programming",
  "test_cases": { "cases": [ { "input": "abcde, ace", "output": "3" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Matrix Chain Multiplication",
  "description": "Given dimensions of matrices, find minimum cost of multiplying them together.",
  "difficulty": "hard",
  "topic": "Dynamic Programming",
  "test_cases": { "cases": [ { "input": "p=[1,2,3,4]", "output": "18" } ] }
}'

curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{
  "title": "Edit Distance",
  "description": "Find the minimum number of operations required to convert string a to string b.",
  "difficulty": "hard",
  "topic": "Dynamic Programming",
  "test_cases": { "cases": [ { "input": "horse, ros", "output": "3" } ] }
}'
