# vocalhelp

README last updated 4/13/2025

does the following:
shows a spectrogram, a spectrum, vocal weight, and formants all in one place. displays goal formants on the screen for one to try to copy. highlights actual formants so you can see them so you can try to align them to the zones.

takes inspiration from the following:
https://27or27.github.io/tm/thickness_meter.htm
https://in-formant.app/

i tried vibecoding using chatgpt-4o and github copilot through vscode for like over 20 hours, eventually trying to manage it myself and then eventually half gave up due to large course load. Then a friend let me use their gemini-2.4 to see if it could code this program better than the other AIs. In short - it did. I coded it up within an hour. I think I'll be using this tool myself for transfeminine training. It's open for anyone to use. I guess give credit if you directly rip my code like I told the AI to do for the above two? (it was legal, their licenses said so i think)


Future improvements:
- Still needs a graph for like vocal register. 
- The current vocal weight meter may be incorrect - did not thoroughly check after gemini-2.4 remade it in its entirety.

- Original plan was to try to parameterize the voice, recreate it, show the user their personal parameters, and guide the user towards what they need to change in order to accomplish their vocal goal. Could try adding that. 
- Allowing for the addition of any inputtable voice, not just specific generic genders.
- Parameterize vowels as well