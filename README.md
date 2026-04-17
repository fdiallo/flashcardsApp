# flashcardsApp
AI time sagings: AI saved a significant amount of time particualarly in writing html structure, css and in the CRUD operations which can be repetitive task great for AI to hangle them.

The filterAndRenderCards method from app.js, AI was not properly calling the renderCards method. I had to had safeguard to check first if query.trim() and then call the renderCards method

I added .skip-link class which is a hidden link at the top of the page that becomes visible when focused with tab