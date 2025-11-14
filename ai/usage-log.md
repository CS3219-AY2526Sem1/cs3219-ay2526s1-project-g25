# AI Usage Log Template


## Entry 1

### Date/Time:
2025-11-13 18:00

### Tool:
ChatGPT

### Prompt/Command:
"You are helping to create original programming questions for a coding platform. For each topic and difficulty level, generate a unique question that includes:

Title: A clear, descriptive name

Topic: One of: Arrays, LinkedList, Binary Tree, Graphs, Dynamic Programming, Trees, Greedy, Two Pointers, Sorting, Recursion, Strings

Difficulty: Easy, Medium, or Hard

Description: A clear explanation of the problem in markdown format (no \n escapes, use actual line breaks). Include examples.

Test Cases: In JSON format with "input" and "output" for each case

Guidelines:

Do NOT copy or adapt problems from LeetCode, Kattis, or other known platforms

Ensure the problem is well-scoped and appropriate for the difficulty level

Use clear and simple input/output formats

Avoid using images or external references

Make descriptions readable with proper markdown formatting (headers, lists, code blocks)

Example Output Format:

Title: Count Even Numbers
Topic: Arrays
Difficulty: Easy
Description: Given an array of integers, return the count of even numbers.

Example
Input: [1, 2, 3, 4]
Output: 2

Test Cases:

json
{
  "cases": [
    {
      "input": "[1, 2, 3, 4]",
      "output": "2"
    },
    {
      "input": "[0, -2, 5]",
      "output": "2"
    }
  ]
}

Please start with LinkedList for easy, medium and hard, all 3."

Subsequent prompts are just something like: "Proceed with "Trees", "Greedy""

### Output Summary:
Questions generated with the prompt descriptions. E.g:
"Sure! Here are three original LinkedList problems (Easy, Medium, and Hard) written in the requested format:..."


### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected

### Author Notes:
Questions are reformatted and added to the question database via the admin panel.
Full chat link: https://chatgpt.com/share/69161d34-ad98-8002-916b-c69a9edfdbca 

---

## Entry 2

### Date/Time:
2025-09 to 2025-10

### Tool:
GitHub Copilot

### Prompt/Command:
Code completion and suggestions while implementing authentication system, including:
- JWT token generation and verification
- Password hashing and validation
- User registration and login endpoints
- Email verification flow
- Password reset functionality

### Output Summary:
Copilot provided code completion suggestions for authentication controller methods, middleware functions, and route handlers. Suggested boilerplate code for JWT operations and API calls.

### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected

### Author Notes:
I designed the authentication architecture and security requirements. Used Copilot for code completion only. Reviewed all code for security vulnerabilities, implemented password strength requirements (12+ chars, uppercase, lowercase, numbers, special chars), designed error handling strategy, and made all integration decisions.

---

## Entry 3

### Date/Time:
2025-09 to 2025-11

### Tool:
GitHub Copilot

### Prompt/Command:
React component generation for authentication UI:
- Login form with validation
- Signup form with password confirmation
- Forgot password modal
- Resend verification modal
- User profile dropdown

### Output Summary:
Copilot provided code completion for React component implementations. Suggested boilerplate code for hooks, form handling, and animation configurations.

### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected

### Author Notes:
I designed the UI/UX requirements and component structure. Used Copilot for code completion only. Implemented validation logic, designed service integration, and made all accessibility and responsive design decisions.

---

## Entry 4

### Date/Time:
2025-09 to 2025-11

### Tool:
GitHub Copilot

### Prompt/Command:
Frontend service layer implementation:
- Authentication service with JWT token management
- User profile service with axios interceptors
- Token refresh logic with request queueing
- Form validation utilities

### Output Summary:
Copilot provided code completion for service class methods and axios setup. Suggested boilerplate code for API calls and standard interceptor patterns.

### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected

### Author Notes:
I designed the token management strategy and service architecture. Used Copilot for code completion only. Implemented race condition prevention, designed cleanup procedures, customized error handling, and verified the complete token refresh flow.

---

## Entry 5

### Date/Time:
2025-09 to 2025-11

### Tool:
GitHub Copilot

### Prompt/Command:
User profile management implementation:
- Get user profile by username
- Update profile (username, password)
- Delete account with password confirmation
- Difficulty tracking (easy/medium/hard question counts)

### Output Summary:
Copilot provided code completion for controller method implementations. Suggested boilerplate code for database operations and request handling.

### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected

### Author Notes:
I designed the profile management features and security model. Used Copilot for code completion only. Implemented owner verification logic, designed the security requirements (password confirmation), created difficulty_counts data structure, and handled all edge cases.

---

## Entry 6

### Date/Time:
2025-09 to 2025-11

### Tool:
GitHub Copilot

### Prompt/Command:
Middleware implementation for authentication and authorization:
- JWT token verification middleware
- Admin role checking middleware
- Request user context injection

### Output Summary:
Copilot provided code completion for Express middleware functions. Suggested boilerplate code for JWT verification and standard error responses.

### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected

### Author Notes:
I designed the authentication and authorization strategy. Used Copilot for code completion only. Validated JWT logic, implemented error response format, designed middleware chain structure, and verified security requirements are met.

---

## Entry 7

### Date/Time:
2025-09 to 2025-11

### Tool:
GitHub Copilot

### Prompt/Command:
User interface styling and animations:
- CSS for authentication pages
- Framer Motion animations for forms and modals
- Responsive design patterns
- Loading states and transitions

### Output Summary:
Copilot provided code completion for CSS and animation configurations. Suggested boilerplate styling patterns and standard Framer Motion setups.

### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected

### Author Notes:
Ensured that the UI generated matches with the product design and theme.

---

## Entry 8

### Date/Time:
2025-09 to 2025-11

### Tool:
GitHub Copilot

### Prompt/Command:
Form validation logic implementation:
- Email format validation
- Username format validation (alphanumeric, length)
- Password strength validation (12+ chars, complexity)
- Form error message generation

### Output Summary:
Copilot provided code completion for validation functions. Suggested boilerplate regex patterns and standard validation logic.

### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected

### Author Notes:
I defined the validation requirements and security policies. Used Copilot for code completion only. Implemented password strength requirements, customized error messages, designed real-time feedback approach, and verified validation meets security standards.

---

## Entry 9

### Date/Time:
2025-09 to 2025-11

### Tool:
GitHub Copilot

### Prompt/Command:
Express route definitions and API structure:
- RESTful route organization for auth endpoints
- User profile routes with username parameters
- Difficulty tracking routes
- Token management routes

### Output Summary:
Copilot provided code completion for Express router setup. Suggested boilerplate code for route definitions and standard HTTP method patterns.

### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected

### Author Notes:
I designed the API structure and endpoint organization. Used Copilot for code completion only. Organized routes by feature domain, implemented validation rules, verified mappings, and determined authentication requirements for each endpoint.

---