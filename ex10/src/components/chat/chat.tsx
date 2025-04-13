"use client";

import { useCallback, useState } from "react";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { useChat } from "@ai-sdk/react";

export function Chat() {
    const handleValueChange = useCallback((value: string) => {
        setInput(value);
    }, []);

    const {
        messages,
        // setMessages,
        handleSubmit,
        input,
        setInput,
        status,
        stop,
    } = useChat({
        // id,
        // body: { id, selectedChatModel: selectedChatModel },
        initialMessages: [
            {
                id: "1",
                role: "user",
                content:
                    "Create a browser extension that makes github links open in a new tab when looking at issues or pull requests",
            },
            {
                id: "2",
                role: "assistant",
                content:
                    "I'll help you create a browser extension that automatically opens GitHub links in new tabs. What would you like to know first?",
            },
            {
                id: "3",
                role: "user",
                content:
                    "How do I detect GitHub issue and PR links on the page?",
            },
            {
                id: "4",
                role: "assistant",
                content:
                    "To detect GitHub issue and PR links, you can use a combination of URL patterns and DOM selectors. Here's how you can do it:\n\n1. For URL patterns, look for paths containing '/issues/' or '/pull/' using:\n   ```js\n   const isIssueOrPR = url.includes('/issues/') || url.includes('/pull/');\n   ```\n\n2. For DOM selection, target anchor tags within issue/PR lists:\n   ```js\n   document.querySelectorAll('.js-issue-row a, .js-issue-title')\n   ```\n\nWould you like me to show you how to combine these into a complete content script?",
            },
            {
                id: "5",
                role: "user",
                content: "Yes, please show me the complete content script",
            },
            {
                id: "6",
                role: "assistant",
                content:
                    "I'll show you a complete content script that handles both issues and pull requests. Here's the code:\n\n```javascript\n// content.js\ndocument.addEventListener('DOMContentLoaded', () => {\n  // Select all issue/PR links\n  const links = document.querySelectorAll('.js-issue-row a, .js-issue-title');\n\n  links.forEach(link => {\n    // Only modify GitHub issue/PR links\n    if (link.href.includes('/issues/') || link.href.includes('/pull/')) {\n      link.setAttribute('target', '_blank');\n      link.setAttribute('rel', 'noopener noreferrer');\n    }\n  });\n\n  // Handle dynamically loaded content\n  const observer = new MutationObserver((mutations) => {\n    mutations.forEach((mutation) => {\n      mutation.addedNodes.forEach((node) => {\n        if (node.nodeType === Node.ELEMENT_NODE) {\n          const newLinks = node.querySelectorAll('.js-issue-row a, .js-issue-title');\n          newLinks.forEach(link => {\n            if (link.href.includes('/issues/') || link.href.includes('/pull/')) {\n              link.setAttribute('target', '_blank');\n              link.setAttribute('rel', 'noopener noreferrer');\n            }\n          });\n        }\n      });\n    });\n  });\n\n  observer.observe(document.body, {\n    childList: true,\n    subtree: true\n  });\n});\n```\n\nWould you like me to explain how this code works, or shall we move on to creating the manifest.json file?",
            },
        ],
        experimental_throttle: 100,
        // sendExtraMessageFields: true,
        // generateId: generateUUID,
        // onFinish: () => {
        //     mutate(unstable_serialize(getChatHistoryPaginationKey));
        // },
        // onError: () => {
        //     toast.error("An error occurred, please try again!");
        // },
    });

    return (
        <div className="flex w-full max-w-3xl flex-col items-center">
            <ChatMessages
                messages={messages}
                status={status}
            />

            <ChatInput
                input={input}
                handleValueChange={handleValueChange}
                handleSubmit={handleSubmit}
                status={status}
                className="mt-auto w-full"
            />
        </div>
    );
}
