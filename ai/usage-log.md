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

## Entry 10

### Date/Time:
2025-09 to 2025-11

### Tool:
ChatGPT

### Prompt/Command:
"Show me how to implement a security flow where the Collaboration UI receives a temp token, redeems it with User Service, removes it from the URL, and stores the JWT in memory. The websockets /ws and /ws-yjs should then take this token, the sessionId and userId to initialise their connections"

### Output Summary:
AI produced code showing how to:
- read sessionId and tempToken from query params
- call User Service to redeem the tempToken
- remove tempToken from the browser URL using window.history.replaceState
- store the issued JWT in memory (React state)
- pass the JWT to WebSocket construction functions

### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected

### Author Notes:
Used the generated code skeleton directly and filled in service URLs and my own state management. Tested by confirming tempToken disappears from URL and JWT is attached to WebSocket connections. Extensive debugging and modification to the generated code was required to get this feature to work after the initial prompt. However, the code provided by AI served as a good starting point for the implementation of this security workflow.

---

## Entry 11

### Date/Time:
2025-09 to 2025-11

### Tool:
ChatGPT

### Prompt/Command:
"When I end the session as a user, 'session ended' alerts show twice and I have to dismiss both alerts before being redirected back to the dashboard. Please help me debug where this issue is coming from and how I can fix it"

### Output Summary:
AI provided a patch that:
- centralizes session-end alert logic
- ensures only one component triggers the popup
- ensures the other component ignores duplicate events
- ensures cleanup only runs once per user

### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected

### Author Notes:
Employed AI help to debug the root cause of the issue. Applied a modified version of the recommended event-handling fix suggestions.

---

## Entry 12

### Date/Time:
2025-09 to 2025-11

### Tool:
ChatGPT

### Prompt/Command:
"I need to implement Yjs to our project's collaborative code editor using WebSocket. How can I go about doing this?"

### Output Summary:
AI generated:
- high-level explanation of how Yjs can be implemented
- a full Yjs WebSocket provider example
- creation of ydoc
- construction of wsUrl with sessionId, userId, token
- call to new WebSocket(wsUrl) placed inside useEffect
- setup for ws.onopen, ws.onclose, ws.onmessage

### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected

### Author Notes:
Extensive debugging and modification to the generated code was required to get this feature to work after the initial prompt. However, the code provided by AI served as a good starting point for the implementation of Yjs.

---

## Entry 13

### Date/Time:
2025-09 to 2025-11

### Tool:
ChatGPT

### Prompt/Command:
"Show me how I can use Judge0 to implement a code execution feature for our group's collaborative code editor"

### Output Summary:
AI generated:
- Fetch request to RapidAPI Judge0 endpoint
- JSON payload with source_code, language_id, stdin
- handling the returned token/result
- broadcasting the result to the session’s WebSocket room

### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected

### Author Notes:
Used the structure directly and adjusted fields (languageId, result parsing). Extensive debugging and modification to the generated code was required to get this feature to work after the initial prompt. However, the code provided by AI served as a good skeleton for the implementation of Judge0.

---