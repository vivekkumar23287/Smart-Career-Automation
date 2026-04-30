

document.addEventListener('DOMContentLoaded', () => {


    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('resume-upload');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const clearJdBtn = document.getElementById('clear-jd-btn');
    const jdText = document.getElementById('jd-text');
    const analyzeBtn = document.getElementById('analyze-btn');
    let currentFile = null;




    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }


    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('dragover');
    }

    function unhighlight(e) {
        dropZone.classList.remove('dragover');
    }


    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }



    dropZone.addEventListener('click', function (e) {
        if (!e.target.closest('.btn-browse')) {
            fileInput.click();
        }
    });


    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });

    jdText.addEventListener('input', () => {
        updateAnalyzeButton();
        toggleClearJdBtn();
    });

    clearJdBtn.addEventListener('click', () => {
        jdText.value = '';
        toggleClearJdBtn();
        updateAnalyzeButton();
        document.getElementById('results-section').style.display = 'none';
    });

    function toggleClearJdBtn() {
        clearJdBtn.style.display = jdText.value.trim().length > 0 ? 'flex' : 'none';
    }

    function handleFiles(files) {
        if (files.length > 0) {
            validateAndPreview(files[0]);
        }
    }

    function validateAndPreview(file) {
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
            alert('Please upload a PDF or DOCX file.');
            return;
        }

        currentFile = file;
        fileName.textContent = file.name;


        const sizeEl = document.getElementById('file-size');
        if (sizeEl) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            sizeEl.textContent = sizeMB + ' MB';
        }


        const iconEl = document.getElementById('file-type-icon');
        if (iconEl) {
            if (file.name.endsWith('.pdf')) {
                iconEl.className = 'ph ph-file-pdf';
                iconEl.closest('.file-info-icon').style.color = '#ef4444';
            } else {
                iconEl.className = 'ph ph-microsoft-word-logo';
                iconEl.closest('.file-info-icon').style.color = '#2563eb';
            }
        }

        dropZone.style.display = 'none';
        fileInfo.style.display = 'flex';

        updateAnalyzeButton();
    }


    window.clearFile = function () {
        currentFile = null;
        fileInput.value = '';

        dropZone.style.display = 'flex';
        fileInfo.style.display = 'none';

        updateAnalyzeButton();
    };

    function updateAnalyzeButton() {

        if (analyzeBtn && jdText) {
            analyzeBtn.disabled = !(currentFile && jdText.value.trim().length > 10);
        }
    }



    analyzeBtn.addEventListener('click', async () => {
        if (!currentFile || !jdText.value.trim()) return;

        analyzeBtn.textContent = 'Analyzing...';
        analyzeBtn.disabled = true;

        try {
            const resumeText = await extractText(currentFile);
            const analysisResults = analyzeResume(resumeText, jdText.value);


            renderResults(analysisResults);


            await saveAnalysisToHistory(currentFile.name, analysisResults);


            loadHistory();

            analyzeBtn.textContent = 'Analyze Resume';
            analyzeBtn.disabled = false;
        } catch (error) {
            console.error('Analysis failed:', error);
            alert('Failed to analyze resume. Please try again.');
            analyzeBtn.textContent = 'Analyze Resume';
            analyzeBtn.disabled = false;
        }
    });




    async function extractText(file) {
        const fileType = file.type;
        if (fileType === 'application/pdf') {
            return await extractPdfText(file);
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            return await extractDocxText(file);
        } else if (fileType === 'text/plain') {
            return await file.text();
        } else {

            if (file.name.endsWith('.pdf')) {
                return await extractPdfText(file);
            } else if (file.name.endsWith('.docx')) {
                return await extractDocxText(file);
            }
            throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
        }
    }

    async function extractPdfText(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let text = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const strings = content.items.map(item => item.str);
                text += strings.join(' ') + '\n';
            }
            return text;
        } catch (error) {
            console.error('PDF Extraction Error:', error);
            throw new Error('Failed to parse PDF file.');
        }
    }

    async function extractDocxText(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            return result.value;
        } catch (error) {
            console.error('DOCX Extraction Error:', error);
            throw new Error('Failed to parse DOCX file.');
        }
    }



    function extractSkillsSection(text) {

        const headingPatterns = [
            /(?:^|\n)\s*(?:#+\s*)?(?:required\s+|preferred\s+|desired\s+|essential\s+)?(?:technical\s+|key\s+|core\s+|relevant\s+|primary\s+)?skills?\s*(?:&\s*(?:competencies|qualifications|technologies|tools))?(?:\s+(?:set|required|needed))?\s*[:\-–—]?\s*(?:\n|$)/im,
            /(?:^|\n)\s*(?:#+\s*)?core\s+competencies\s*[:\-–—]?\s*(?:\n|$)/im,
            /(?:^|\n)\s*(?:#+\s*)?tech(?:nology|nical)?\s+(?:stack|requirements?|proficienc(?:y|ies))\s*[:\-–—]?\s*(?:\n|$)/im,
            /(?:^|\n)\s*(?:#+\s*)?tools?\s+(?:&|and)\s+technologies\s*[:\-–—]?\s*(?:\n|$)/im,
            /(?:^|\n)\s*(?:#+\s*)?(?:what\s+you(?:'ll)?\s+(?:need|bring)|must[\s-]have(?:\s+skills)?)\s*[:\-–—]?\s*(?:\n|$)/im,
            /(?:^|\n)\s*(?:#+\s*)?proficienc(?:y|ies)\s*[:\-–—]?\s*(?:\n|$)/im
        ];


        const nextHeadingPattern = /\n\s*(?:#+\s*)?(?:about|responsibilit|requirement|qualification|experience|education|benefit|compensation|salar|who\s+we|what\s+(?:you|we)|job\s+desc|dut(?:y|ies)|overview|summary|objective|project|certification|award|interest|hobb|reference|contact|work\s+(?:history|experience)|professional\s+experience|employment|personal|nice[\s-]to[\s-]have|preferred\s+qualif|additional|equal\s+opportunity|disclaimer)\b/im;

        for (const pattern of headingPatterns) {
            const match = text.match(pattern);
            if (match) {
                const startIndex = match.index + match[0].length;
                const remaining = text.substring(startIndex);

                const nextMatch = remaining.match(nextHeadingPattern);
                const sectionText = nextMatch
                    ? remaining.substring(0, nextMatch.index)
                    : remaining;

                const trimmed = sectionText.trim();
                if (trimmed.length > 5) {
                    return trimmed;
                }
            }
        }


        return text;
    }



    const KNOWN_SKILLS = [

        'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go',
        'rust', 'swift', 'kotlin', 'scala', 'perl', 'r', 'matlab', 'dart', 'lua',
        'objective-c', 'visual basic', 'vb.net', 'assembly', 'haskell', 'elixir',
        'clojure', 'groovy', 'shell scripting', 'bash', 'powershell', 'cobol', 'fortran',

        'react', 'react.js', 'angular', 'angular.js', 'vue', 'vue.js', 'next.js', 'nuxt.js',
        'svelte', 'jquery', 'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less',
        'tailwind', 'tailwindcss', 'bootstrap', 'material ui', 'chakra ui', 'webpack',
        'vite', 'babel', 'redux', 'mobx', 'zustand', 'responsive design',

        'node.js', 'express', 'express.js', 'django', 'flask', 'fastapi', 'spring',
        'spring boot', '.net', 'asp.net', 'rails', 'ruby on rails', 'laravel', 'nestjs',
        'koa', 'fastify', 'microservices', 'serverless', 'api development',

        'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
        'dynamodb', 'firebase', 'supabase', 'sqlite', 'oracle', 'mariadb', 'neo4j',
        'couchdb', 'sql server', 'ms sql', 'database management', 'pl/sql', 'nosql',

        'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'jenkins',
        'terraform', 'ansible', 'ci/cd', 'github actions', 'gitlab ci', 'circleci',
        'nginx', 'apache', 'linux', 'unix', 'windows server', 'cloud computing',
        'aws lambda', 'ec2', 's3', 'cloudformation', 'heroku', 'vercel', 'netlify',

        'git', 'github', 'gitlab', 'bitbucket', 'svn', 'jira', 'confluence', 'trello',
        'slack', 'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'vs code',
        'visual studio', 'intellij', 'eclipse', 'postman', 'swagger',

        'machine learning', 'deep learning', 'ai', 'artificial intelligence', 'nlp',
        'natural language processing', 'computer vision', 'tensorflow', 'pytorch',
        'keras', 'scikit-learn', 'pandas', 'numpy', 'tableau', 'power bi', 'data science',
        'data analysis', 'data engineering', 'big data', 'hadoop', 'spark', 'kafka',
        'airflow', 'etl', 'data visualization', 'data mining', 'statistics',

        'react native', 'flutter', 'ios', 'android', 'xamarin', 'ionic', 'swift ui',
        'mobile development',

        'rest api', 'restful', 'graphql', 'grpc', 'websocket', 'soap', 'json', 'xml',
        'oauth', 'jwt', 'api integration',

        'jest', 'mocha', 'cypress', 'selenium', 'puppeteer', 'playwright', 'junit',
        'pytest', 'unit testing', 'integration testing', 'qa', 'quality assurance',
        'test automation', 'manual testing',

        'agile', 'scrum', 'kanban', 'waterfall', 'devops', 'soa', 'sdlc', 'tdd', 'bdd',
        'oop', 'design patterns', 'solid principles', 'clean code',

        'cybersecurity', 'information security', 'network security', 'penetration testing',
        'encryption', 'ssl', 'tls', 'firewall', 'vpn', 'siem', 'vulnerability assessment',
        'security protocols', 'antivirus', 'malware analysis',

        'networking', 'tcp/ip', 'dns', 'dhcp', 'lan', 'wan', 'vpn', 'active directory',
        'windows', 'macos', 'troubleshooting', 'technical support', 'help desk',
        'it support', 'hardware', 'software installation', 'system administration',
        'backup', 'disaster recovery', 'remote desktop', 'printer', 'ticketing system',

        'ms office', 'microsoft office', 'excel', 'word', 'powerpoint', 'outlook',
        'google workspace', 'google sheets', 'google docs', 'sharepoint', 'teams',
        'microsoft teams', 'zoom', 'office 365',

        'seo', 'sem', 'google analytics', 'analytics', 'digital marketing',
        'content marketing', 'social media marketing', 'email marketing', 'crm',
        'salesforce', 'hubspot',

        'ui/ux', 'ux design', 'ui design', 'graphic design', 'wireframing', 'prototyping',
        'user research', 'adobe creative suite', 'canva', 'indesign',

        'project management', 'pmp', 'prince2', 'six sigma', 'lean', 'risk management',
        'business analysis', 'stakeholder management',

        'sap', 'erp', 'quickbooks', 'sage', 'workday', 'servicenow',

        'blockchain', 'web3', 'solidity', 'smart contracts', 'iot', 'ar/vr',
        'robotic process automation', 'rpa',

        'communication', 'leadership', 'problem solving', 'teamwork', 'time management',
        'critical thinking', 'attention to detail', 'customer service', 'multitasking',
        'presentation skills', 'negotiation', 'conflict resolution'
    ];



    function parseSkillItems(sectionText) {
        const lines = sectionText.split(/\n/);
        let items = [];

        for (const line of lines) {

            const parts = line.split(/[,;|•●◦▪▸►]+/)
                .map(s => s.replace(/^[\s\-\*\d.:)\]►▶→]+/, '').trim())  // strip leading bullets/numbering
                .map(s => s.replace(/^[.,:\-]+|[.,:\-]+$/g, '').trim())   // strip trailing punctuation
                .filter(s => s.length > 1 && s.length < 40);
            items.push(...parts);
        }


        const fillerPatterns = /^(and\s|or\s|the\s|a\s|an\s|in\s|on\s|at\s|to\s|for\s|of\s|with\s|by\s|as\s|is\s|are\s|was\s|were\s|be\s|been\s|have\s|has\s|had\s|do\s|does\s|did\s|will\s|would\s|shall\s|should\s|may\s|might\s|can\s|could\s|must\s|ability\s|able\s|knowledge\s|proficien|experience\s|understanding\s|familiar|capable|demonstrat|develop|maintain|manag|ensur|work\s|support\s|install\s|perform|assist|provid|creat|handl|resolv|adhere|coordinat|identif|implement|configur|monitor|document|analyz|collaborat|troubleshoot\s|diagnos)/i;

        const stopWords = [
            'experience', 'years', 'work', 'job', 'role', 'team', 'company', 'candidate',
            'skills', 'requirements', 'responsibilities', 'description', 'ability',
            'knowledge', 'understanding', 'proficiency', 'opportunity', 'degree',
            'bachelor', 'master', 'position', 'members', 'adhere', 'overview',
            'solutions', 'systems', 'applications', 'services', 'needs', 'support',
            'issues', 'problems', 'projects', 'tasks', 'duties', 'strong', 'excellent',
            'good', 'great', 'proven', 'demonstrated', 'proficient', 'detail',
            'oriented', 'minimum', 'preferred', 'required', 'equivalent', 'plus',
            'including', 'other', 'related', 'field', 'area', 'must', 'shall',
            'team members', 'digital files', 'role overview'
        ];

        return items
            .map(s => s.toLowerCase().trim())
            .filter(s => s.length > 1)
            .filter(s => !fillerPatterns.test(s))
            .filter(s => !stopWords.includes(s))

    }



    function analyzeResume(resumeText, jobDescription) {

        const jdSkillsSection = extractSkillsSection(jobDescription);
        const resumeSkillsSection = extractSkillsSection(resumeText);

        const cleanJDSkills = jdSkillsSection.toLowerCase();
        const cleanResumeSkills = resumeSkillsSection.toLowerCase();


        const cleanResume = resumeText.toLowerCase();


        let dictionaryMatches = KNOWN_SKILLS.filter(skill => {

            if (skill.length <= 3) {
                const regex = new RegExp('(?:^|[\\s,;|•\\-])' + skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:$|[\\s,;|•\\-])', 'i');
                return regex.test(jdSkillsSection);
            }
            return cleanJDSkills.includes(skill);
        });


        let parsedItems = parseSkillItems(jdSkillsSection);


        let extraSkills = parsedItems.filter(item => {

            if (dictionaryMatches.some(d => d === item || item.includes(d) || d.includes(item))) {
                return false;
            }

            if (item.split(/\s+/).length > 3) return false;
            return true;
        });


        extraSkills = [...new Set(extraSkills)];


        let keywords = [...new Set([...dictionaryMatches, ...extraSkills.slice(0, 8)])];


        if (keywords.length === 0) return createEmptyResult();

        let matched = [];
        let missing = [];


        keywords.forEach(keyword => {
            if (cleanResumeSkills.includes(keyword)) {
                matched.push(keyword);
            } else {
                missing.push(keyword);
            }
        });

        const keywordScore = Math.round((matched.length / keywords.length) * 100);


        let experienceScore = 50;
        if (cleanResume.includes('years') || cleanResume.includes('experience')) experienceScore += 10;
        if (cleanResume.includes('senior') || cleanResume.includes('lead') || cleanResume.includes('manager')) experienceScore += 10;
        if (keywordScore > 50) experienceScore += 20;
        if (keywordScore > 75) experienceScore += 10;
        experienceScore = Math.min(100, experienceScore);


        const totalWords = cleanResume.split(/\s+/).length;
        const matchedCount = matched.reduce((acc, k) => acc + (cleanResume.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 0);
        const density = (matchedCount / totalWords) * 100;
        let densityScore = Math.min(100, Math.round((density / 2) * 100));
        if (densityScore < 30 && keywordScore > 50) densityScore = 50;


        const formatScore = 95;


        let skillScore = keywordScore;
        if (dictionaryMatches.length > 0) {
            const matchedDict = dictionaryMatches.filter(t => cleanResumeSkills.includes(t));
            skillScore = Math.round((matchedDict.length / dictionaryMatches.length) * 100);
        }


        const finalScore = Math.round(
            (keywordScore * 0.35) +
            (skillScore * 0.30) +
            (experienceScore * 0.20) +
            (formatScore * 0.10) +
            (densityScore * 0.05)
        );

        return {
            score: finalScore,
            keywordScore,
            skillScore,
            formatScore,
            experienceScore,
            densityScore,
            matched,
            missing,
            jobTitle: 'Analyzed Position'
        };
    }

    function createEmptyResult() {
        return { score: 0, keywordScore: 0, skillScore: 0, formatScore: 100, experienceScore: 0, densityScore: 0, matched: [], missing: [], jobTitle: 'Unknown' };
    }


    function renderResults(results) {
        document.getElementById('results-section').style.display = 'block';


        animateValue('score-text', 0, results.score, 1500);
        document.getElementById('score-circle-path').style.strokeDasharray = `${results.score}, 100`;


        const circle = document.getElementById('score-circle-path');
        circle.classList.remove('score-low', 'score-medium', 'score-high');
        if (results.score < 50) circle.classList.add('score-low');
        else if (results.score < 80) circle.classList.add('score-medium');
        else circle.classList.add('score-high');


        updateMetric('skills', results.skillScore);
        updateMetric('format', results.formatScore);
        updateMetric('experience', results.experienceScore);
        updateMetric('density', results.densityScore);


        renderTags('matched-keywords', results.matched, 'tag-matched');
        renderTags('missing-keywords', results.missing, 'tag-missing');


        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    }

    function updateMetric(id, value) {
        document.getElementById(`${id}-score-val`).textContent = `${value}%`;
        document.getElementById(`${id}-score-bar`).style.width = `${value}%`;


        const bar = document.getElementById(`${id}-score-bar`);
        bar.style.backgroundColor = value < 50 ? '#ef4444' : value < 80 ? '#f59e0b' : '#22c55e';
    }

    function renderTags(containerId, tags, className) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        if (tags.length === 0) {
            container.innerHTML = '<span class="text-gray-500 text-sm">None found</span>';
            return;
        }
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = `tag ${className}`;
            span.textContent = tag;
            container.appendChild(span);
        });
    }

    function animateValue(id, start, end, duration) {
        const obj = document.getElementById(id);
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start) + '%';
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }



    async function saveAnalysisToHistory(fileName, results) {
        try {
            const res = await window.apiFetch('/api/resume-history', {
                method: 'POST',
                body: { fileName, results }
            });

            if (!res || !res.ok) throw new Error('Failed to save analysis');
            console.log("Analysis saved to history");
        } catch (err) {
            console.error("Error saving history:", err);
        }
    }

    async function loadHistory() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        try {
            const res = await window.apiFetch('/api/resume-history', {
                method: 'GET'
            });

            if (!res || !res.ok) throw new Error('Failed to load history');
            const data = await res.json();

            if (!data || data.length === 0) {
                historyList.innerHTML = '<div class="empty-state">No recent scans found.</div>';
                return;
            }

            historyList.innerHTML = data.map(item => `
                <div class="history-item">
                    <div class="history-info">
                        <strong>${item.resume_name}</strong>
                        <span class="date">${new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="history-score ${getScoreClass(item.total_score)}">
                        ${item.total_score}%
                    </div>
                </div>
            `).join('');

        } catch (err) {
            console.error("Error loading history:", err);
            historyList.innerHTML = '<div class="error-state">Failed to load history</div>';
        }
    }

    function getScoreClass(score) {
        if (score >= 80) return 'score-high-text';
        if (score >= 50) return 'score-medium-text';
        return 'score-low-text';
    }


    setTimeout(loadHistory, 2000);
});
