(() => {
  const content = window.BASMALA_CONTENT || { courses: [] };
  const key = 'murabitoun.progress.v1';
  const readProgress = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(key)) || {};
      return {
        attempts: Array.isArray(saved.attempts) ? saved.attempts : [],
        favorites: Array.isArray(saved.favorites) ? saved.favorites : [],
        completedCourses: Array.isArray(saved.completedCourses) ? saved.completedCourses : []
      };
    } catch { return { attempts: [], favorites: [], completedCourses: [] }; }
  };
  let progress = readProgress();
  let activeQuizCleanup = null;
  const save = () => localStorage.setItem(key, JSON.stringify(progress));
  const allQuizzes = () => content.courses.flatMap(course => (course.quizzes || []).map(quiz => ({ course, quiz })));
  const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);
  const questionTotal = quizzes => quizzes.reduce((sum, quiz) => sum + (quiz.questions || []).length, 0);
  const formatCourseDate = value => {
    if (!value) return '';
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return '';
    const date = new Date(year, month - 1, day, 12);
    const weekdays = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    return `${weekdays[date.getDay()]} ${day}/${month}/${year}`;
  };
  const page = () => location.hash.replace(/^#\/?/, '') || 'home';
  const route = (name, label, active) => `<a class="nav-link ${active ? 'active' : ''}" href="#${name}">${label}</a>`;
  const layout = (body, current) => `
    <header class="site-header"><div class="container py-3 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
      <a class="brand-lockup d-flex align-items-center gap-2 text-decoration-none" href="#home"><img class="brand-logo" src="./assets/logo.png" alt="شعار مرابطون" onerror="this.hidden=true;this.nextElementSibling.classList.remove('visually-hidden')"><span class="brand-name visually-hidden">مرابطون</span></a>
      <nav class="nav flex-nowrap overflow-auto" aria-label="التنقل الرئيسي">
        ${route('home','الرئيسية',current==='home')}${route('courses','المقررات',current==='courses')}${route('favorites','المفضلة',current==='favorites')}${route('progress','تقدمي',current==='progress')}${route('history','مراجعاتي',current==='history')}
      </nav>
    </div></header>
    <main class="container py-4 py-lg-5 fade-in">${body}</main>
    <footer><div class="container py-4 d-flex flex-column flex-md-row justify-content-between gap-2"><span>مرابطون · جميع الحقوق محفوظة 2026</span><span>تُحفظ نتائجك ومفضلاتك على هذا الجهاز فقط</span></div></footer>`;

  function courseCard(course) {
    const quizzes = course.quizzes || [];
    const done = quizzes.filter(({ id }) => progress.attempts.some(attempt => attempt.quizId === id)).length;
    const percent = quizzes.length ? Math.round(done / quizzes.length * 100) : 0;
    const fav = progress.favorites.includes(course.id);
    const completed = progress.completedCourses.includes(course.id);
    const resourceTypes = { lecture:'محاضرة', book:'كتاب', matn:'متن' };
    const courseDate = formatCourseDate(course.date);
    return `<article class="content-card p-4 d-flex flex-column gap-3">
      <div class="d-flex justify-content-between align-items-start"><span class="icon-box">${course.category === 'اللغة' ? 'ا' : course.category === 'الحاسوب' ? '⌘' : '◎'}</span>
      <button class="btn btn-sm ${fav ? 'btn-basmala' : 'btn-outline-basmala'}" data-favorite="${safe(course.id)}" aria-label="${fav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}">${fav ? '♥' : '♡'}</button></div>
      <div class="flex-grow-1"><div class="d-flex flex-wrap gap-2"><span class="category-label">${safe(resourceTypes[course.resourceType] || 'محاضرة')}</span><span class="category-label">${safe(course.category || 'عام')}</span>${course.lectureNumber ? `<span class="category-label">المحاضرة ${safe(course.lectureNumber)}</span>` : ''}</div><h2 class="h5 fw-bold mt-3">${safe(course.title)}</h2>${course.lecturer ? `<p class="text-secondary mb-1">المحاضر: ${safe(course.lecturer)}</p>` : ''}${courseDate ? `<p class="text-secondary mb-0">${safe(courseDate)}</p>` : ''}${course.description ? `<p class="text-secondary mt-2 mb-0">${safe(course.description)}</p>` : ''}</div>
      <label class="form-check d-flex align-items-center gap-2 mb-0"><input class="form-check-input ms-0 mt-0" type="checkbox" data-course-completion="${safe(course.id)}" ${completed ? 'checked' : ''}><span class="form-check-label fw-bold">${completed ? 'تم إتمام المقرر' : 'أتممت المقرر'}</span></label>
      ${quizzes.length ? `<div class="small text-secondary">${quizzes.length} اختبارات · ${questionTotal(quizzes)} أسئلة</div><div><div class="progress" role="progressbar" aria-label="تقدمك في ${safe(course.title)}" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:${percent}%"></div></div><div class="small text-secondary mt-1">أُنجز ${percent}% من الاختبارات</div></div>` : '<div class="small text-secondary">المحتوى قريبًا</div>'}
      <button class="btn btn-basmala w-100" data-course="${safe(course.id)}">عرض تفاصيل المقرر</button>
    </article>`;
  }
  function courseGrid(courses) {
    if (!courses.length) return '<div class="alert alert-light border">لا توجد مقررات هنا بعد.</div>';
    return `<div class="row g-3 g-lg-4">${courses.map(course => `<div class="col-md-6 col-xl-4">${courseCard(course)}</div>`).join('')}</div>`;
  }
  function home() {
    const quizzes = allQuizzes();
    const average = progress.attempts.length ? Math.round(progress.attempts.reduce((sum, attempt) => sum + attempt.percent, 0) / progress.attempts.length) : null;
    return `<section class="hero mb-5"><div class="eyebrow hero-eyebrow">أهلاً بك في مرابطون</div><h1 class="hero-title fw-bold">تعلّم بوعي، وراجع بفهم،<br> وأتقن ما تتعلّم.</h1><p class="hero-copy text-secondary">كل ما تحتاجه لمراجعة مقرراتك واختبار فهمك، من أسئلة تفاعلية تساعدك على تثبيت المعلومات وتحديد ما يحتاج منك إلى مزيد من المراجعة.</p><div class="hero-actions d-flex flex-wrap gap-2"><a href="#courses" class="btn btn-basmala">ابدأ المراجعة</a><a href="#progress" class="btn btn-outline-basmala">عرض تقدمي</a></div></section>
      <section class="mb-5"><h2 class="section-title mb-3">مساحتك التعليمية</h2><div class="row g-3"><div class="col-6 col-lg-3"><div class="content-card p-3"><div class="stat-number">${content.courses.length}</div><div class="text-secondary">مقررات</div></div></div><div class="col-6 col-lg-3"><div class="content-card p-3"><div class="stat-number">${quizzes.length}</div><div class="text-secondary">اختبارات</div></div></div><div class="col-6 col-lg-3"><div class="content-card p-3"><div class="stat-number">${questionTotal(quizzes.map(item => item.quiz))}</div><div class="text-secondary">أسئلة</div></div></div><div class="col-6 col-lg-3"><div class="content-card p-3"><div class="stat-number">${average === null ? '—' : `${average}%`}</div><div class="text-secondary">متوسط نتائجك</div></div></div></div></section>
      <section><div class="d-flex justify-content-between align-items-center mb-3"><h2 class="section-title mb-0">المقررات</h2><a href="#courses" class="text-success fw-bold">عرض الكل ←</a></div>${courseGrid(content.courses.slice(0,3))}</section>`;
  }
  function coursesView() {
    const categories = [...new Set(content.courses.map(course => course.category).filter(Boolean))];
    return `<div class="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4"><div><div class="eyebrow">تعلّم على مهل</div><h1 class="section-title mb-0">المقررات</h1></div><div class="d-flex flex-column flex-sm-row gap-2"><input id="search-courses" class="form-control" type="search" placeholder="ابحث عن مقرر" aria-label="ابحث عن مقرر"><select id="filter-category" class="form-select" aria-label="تصفية حسب التصنيف"><option value="">كل التصنيفات</option>${categories.map(category => `<option>${safe(category)}</option>`).join('')}</select></div></div><div id="course-results">${courseGrid(content.courses)}</div>`;
  }
  function courseDetail(id) {
    const course = content.courses.find(item => item.id === id);
    if (!course) return `<div class="alert alert-warning">لم نعثر على هذا المقرر. <a href="#courses">العودة إلى المقررات</a></div>`;
    const quizzes = course.quizzes || [];
    const courseDate = formatCourseDate(course.date);
    const lectureInfo = `<div class="content-card p-4 mb-4"><div class="d-flex flex-wrap gap-2 mb-3"><span class="category-label">${safe(course.category || 'مقرر')}</span>${course.lectureNumber ? `<span class="category-label">المحاضرة ${safe(course.lectureNumber)}</span>` : ''}</div><h1 class="section-title">${safe(course.title)}</h1>${course.lecturer ? `<p class="mb-1">المحاضر: ${safe(course.lecturer)}</p>` : ''}${courseDate ? `<p class="text-secondary mb-0">${safe(courseDate)}</p>` : ''}${course.description ? `<p class="text-secondary mt-3 mb-0">${safe(course.description)}</p>` : ''}</div>`;
    const quizContent = quizzes.length ? `<div class="row g-3">${quizzes.map(quiz => `<div class="col-md-6"><article class="content-card p-4"><div class="d-flex justify-content-between gap-2"><div><h2 class="h5 fw-bold">${safe(quiz.title)}</h2>${quiz.description ? `<p class="text-secondary">${safe(quiz.description)}</p>` : ''}</div><span class="category-label">${quiz.mode === 'practice' ? 'تدريب' : 'اختبار'}</span></div><div class="small text-secondary mb-3">${(quiz.questions || []).length} أسئلة${progress.attempts.some(attempt => attempt.quizId === quiz.id) ? ' · أتممت هذا الاختبار سابقاً' : ''}</div><button class="btn btn-basmala" data-quiz="${safe(quiz.id)}">ابدأ الاختبار</button></article></div>`).join('')}</div>` : '<div class="alert alert-light border">المحتوى قريبًا</div>';
    return `<button class="btn btn-link px-0 text-success" data-go="courses">← كل المقررات</button>${lectureInfo}${quizContent}`;
  }
  function progressView() {
    const attempts = progress.attempts;
    const average = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percent, 0) / attempts.length) : 0;
    const done = new Set(attempts.map(attempt => attempt.quizId)).size;
    const total = allQuizzes().length;
    return `<div class="eyebrow">كل خطوة تُحسب</div><h1 class="section-title mb-4">تقدمي</h1><div class="row g-3 mb-4"><div class="col-6 col-lg-4"><div class="content-card p-4"><div class="stat-number">${done}/${total}</div><div class="text-secondary">اختبارات أُنجزت</div></div></div><div class="col-6 col-lg-4"><div class="content-card p-4"><div class="stat-number">${average}%</div><div class="text-secondary">متوسط النتائج</div></div></div><div class="col-12 col-lg-4"><div class="content-card p-4"><div class="stat-number">${attempts.length}</div><div class="text-secondary">إجمالي المحاولات</div></div></div></div><h2 class="h5 fw-bold mb-3">تقدم المقررات</h2>${courseGrid(content.courses)}${attempts.length ? `<button class="btn btn-outline-danger mt-4" data-clear>مسح تقدمي من هذا الجهاز</button>` : '<p class="text-secondary">ابدأ اختباراً لتظهر تفاصيل تقدمك هنا.</p>'}`;
  }
  function historyView() {
    if (!progress.attempts.length) return '<div class="eyebrow">نتائجك السابقة</div><h1 class="section-title">مراجعاتي</h1><div class="alert alert-light border mt-4">لا توجد محاولات محفوظة بعد. ستجد نتائج اختباراتك هنا.</div>';
    return `<div class="eyebrow">نتائجك السابقة</div><h1 class="section-title mb-4">مراجعاتي</h1><div class="table-responsive content-card"><table class="table align-middle mb-0"><thead><tr><th>الاختبار</th><th>المقرر</th><th>النتيجة</th><th>التاريخ</th></tr></thead><tbody>${[...progress.attempts].reverse().map(attempt => { const found = allQuizzes().find(item => item.quiz.id === attempt.quizId); return `<tr><td>${safe(found?.quiz.title || 'اختبار')}</td><td>${safe(found?.course.title || '')}</td><td class="fw-bold">${attempt.score}/${attempt.total} (${attempt.percent}%)</td><td>${new Date(attempt.date).toLocaleDateString('ar')}</td></tr>`; }).join('')}</tbody></table></div>`;
  }
  function quizView(id) {
    const found = allQuizzes().find(item => item.quiz.id === id);
    if (!found) return '<div class="alert alert-warning">الاختبار غير موجود.</div>';
    const { course, quiz } = found;
    if (!quiz.questions.length) return '<div class="alert alert-light border">لا توجد أسئلة في هذا الاختبار.</div>';
    const firstQuestion = quiz.questions[0];
    return `<div class="eyebrow">${safe(course.title)}</div><h1 class="section-title">${safe(quiz.title)}</h1><form id="quiz-form" data-quiz-id="${safe(quiz.id)}" data-course-id="${safe(course.id)}" novalidate>
      <div class="quiz-progress-wrap mb-3">
        <div class="d-flex justify-content-between align-items-center gap-3 mb-2"><strong id="quiz-question-count" aria-live="polite">السؤال 1 من ${quiz.questions.length}</strong><span class="quiz-timer" role="timer" aria-label="الوقت المتبقي"><span aria-hidden="true">⏱</span> <span id="quiz-timer-value">20</span> ث</span></div>
        <div class="progress" role="progressbar" aria-label="تقدم الاختبار" aria-valuenow="1" aria-valuemin="0" aria-valuemax="${quiz.questions.length}"><div id="quiz-progress-bar" class="progress-bar" style="width:${100 / quiz.questions.length}%"></div></div>
      </div>
      <div id="quiz-question" class="quiz-question-stage"><fieldset class="content-card quiz-question-card p-4 mb-3"><legend class="h5 fw-bold">1. ${safe(firstQuestion.text)}</legend><div class="d-grid gap-2 mt-3">${firstQuestion.options.map((option,optionIndex) => `<label class="question-option"><input type="radio" name="quiz-answer" value="${optionIndex}"><span>${safe(option)}</span></label>`).join('')}</div><div class="answer-feedback small mt-3" hidden></div></fieldset></div>
      <button class="btn btn-outline-basmala" type="button" data-go="course/${safe(course.id)}">عودة للمقرر</button>
    </form>`;
  }
  function render() {
    activeQuizCleanup?.();
    activeQuizCleanup = null;
    progress = readProgress();
    const current = page();
    let body;
    if (current === 'home') body = home();
    else if (current === 'courses') body = coursesView();
    else if (current === 'favorites') body = `<div class="eyebrow">احتفظ بما تريد العودة إليه</div><h1 class="section-title mb-4">المفضلة</h1>${courseGrid(content.courses.filter(course => progress.favorites.includes(course.id)))}`;
    else if (current === 'progress') body = progressView();
    else if (current === 'history') body = historyView();
    else if (current.startsWith('course/')) body = courseDetail(current.slice(7));
    else if (current.startsWith('quiz/')) body = quizView(current.slice(5));
    else body = '<div class="alert alert-light border">هذه الصفحة غير متاحة.</div>';
    document.getElementById('app').innerHTML = layout(body,current.split('/')[0]);
    bindEvents();
  }
  function bindEvents() {
    document.querySelectorAll('[data-quiz]').forEach(button => button.addEventListener('click', () => { location.hash = `quiz/${button.dataset.quiz}`; }));
    document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => { location.hash = button.dataset.go; }));
    const search = document.getElementById('search-courses');
    const category = document.getElementById('filter-category');
    const filter = () => {
      if (!search || !category) return;
      const query = search.value.trim().toLocaleLowerCase();
      const selected = category.value;
      document.getElementById('course-results').innerHTML = courseGrid(content.courses.filter(course => (!selected || course.category === selected) && (!query || `${course.title} ${course.description}`.toLocaleLowerCase().includes(query))));
      bindCourseButtons();
    };
    search?.addEventListener('input', filter); category?.addEventListener('change', filter);
    bindCourseButtons();
    document.querySelector('[data-clear]')?.addEventListener('click', () => {
      if (confirm('هل تريد مسح كل نتائجك ومفضلاتك وحالات إتمام المقررات المحفوظة على هذا الجهاز؟')) { progress = { attempts: [], favorites: [], completedCourses: [] }; save(); render(); }
    });
    const quizForm = document.getElementById('quiz-form');
    if (quizForm) bindQuiz(quizForm);
  }
  function bindQuiz(form) {
    const found = allQuizzes().find(item => item.quiz.id === form.dataset.quizId);
    if (!found) return;
    const { course, quiz } = found;
    const questions = quiz.questions;
    const answers = new Array(questions.length).fill(null);
    const defaultSeconds = 20;
    const questionContainer = form.querySelector('#quiz-question');
    const counter = form.querySelector('#quiz-question-count');
    const timerValue = form.querySelector('#quiz-timer-value');
    const progressTrack = form.querySelector('.progress');
    const progressBar = form.querySelector('#quiz-progress-bar');
    let currentIndex = 0;
    let deadline = 0;
    const quizStartedAt = Date.now();
    let timerId = null;
    let transitionId = null;
    let feedbackCountdownId = null;
    let locked = false;
    let finished = false;

    const clearTimer = () => {
      if (timerId !== null) window.clearInterval(timerId);
      timerId = null;
    };
    const cleanup = () => {
      clearTimer();
      if (transitionId !== null) window.clearTimeout(transitionId);
      transitionId = null;
      if (feedbackCountdownId !== null) window.clearInterval(feedbackCountdownId);
      feedbackCountdownId = null;
    };
    activeQuizCleanup = cleanup;

    function renderQuestion() {
      const question = questions[currentIndex];
      const questionNumber = currentIndex + 1;
      const seconds = Number(question.timeLimit ?? quiz.questionTimeLimit);
      const duration = Number.isFinite(seconds) && seconds > 0 ? seconds : defaultSeconds;
      locked = false;
      counter.textContent = `السؤال ${questionNumber} من ${questions.length}`;
      progressTrack.setAttribute('aria-valuenow', String(questionNumber));
      progressBar.style.width = `${questionNumber / questions.length * 100}%`;
      questionContainer.innerHTML = `<fieldset class="content-card quiz-question-card p-4 mb-3"><legend class="h5 fw-bold">${questionNumber}. ${safe(question.text)}</legend><div class="d-grid gap-2 mt-3">${question.options.map((option,optionIndex) => `<label class="question-option"><input type="radio" name="quiz-answer" value="${optionIndex}"><span>${safe(option)}</span></label>`).join('')}</div><div class="answer-feedback small mt-3" hidden></div></fieldset>`;
      deadline = Date.now() + duration * 1000;
      timerValue.textContent = String(duration);
      timerValue.parentElement.classList.remove('is-urgent');
      clearTimer();
      timerId = window.setInterval(updateTimer, 100);
      updateTimer();
    }

    function updateTimer() {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      timerValue.textContent = String(remaining);
      timerValue.parentElement.classList.toggle('is-urgent', remaining <= 5);
      if (remaining === 0) acceptAnswer(null, true);
    }

    function acceptAnswer(selected, timedOut) {
      if (locked || finished) return;
      locked = true;
      clearTimer();
      const question = questions[currentIndex];
      answers[currentIndex] = selected;
      const feedback = questionContainer.querySelector('.answer-feedback');
      const labels = [...questionContainer.querySelectorAll('.question-option')];
      questionContainer.querySelectorAll('input').forEach(input => { input.disabled = true; });
      labels.forEach((label, index) => {
        if (index === question.correctAnswer) label.classList.add('answer-correct');
        else if (index === selected) label.classList.add('answer-wrong');
      });
      feedback.hidden = false;
      if (timedOut) {
        feedback.innerHTML = `انتهى الوقت. الإجابة الصحيحة: ${safe(question.options[question.correctAnswer])}. ${safe(question.explanation || '')}`;
      } else {
        feedback.innerHTML = `${selected === question.correctAnswer ? '<span class="text-success fw-bold">إجابة صحيحة.</span>' : '<span class="text-danger fw-bold">إجابة غير صحيحة. الإجابة الصحيحة: ' + safe(question.options[question.correctAnswer]) + '.</span>'} ${safe(question.explanation || '')}`;
      }
      const isLastQuestion = currentIndex + 1 >= questions.length;
      feedback.insertAdjacentHTML('beforeend', `<div class="feedback-countdown" role="status">${isLastQuestion ? 'ستظهر النتيجة' : 'الانتقال إلى السؤال التالي'} بعد <strong>5</strong> ثوانٍ</div>`);
      const feedbackDeadline = Date.now() + 5000;
      const feedbackCountdown = feedback.querySelector('.feedback-countdown strong');
      feedbackCountdownId = window.setInterval(() => {
        const remaining = Math.max(0, Math.ceil((feedbackDeadline - Date.now()) / 1000));
        feedbackCountdown.textContent = String(remaining);
      }, 100);
      transitionId = window.setTimeout(() => {
        transitionId = null;
        if (feedbackCountdownId !== null) window.clearInterval(feedbackCountdownId);
        feedbackCountdownId = null;
        if (currentIndex + 1 >= questions.length) finishQuiz();
        else { currentIndex++; renderQuestion(); }
      }, 5000);
    }

    function finishQuiz() {
      if (finished) return;
      finished = true;
      cleanup();
      const score = answers.reduce((total, answer, index) => total + (answer === questions[index].correctAnswer ? 1 : 0), 0);
      const percent = Math.round(score / questions.length * 100);
      const durationSeconds = Math.max(0, Math.round((Date.now() - quizStartedAt) / 1000));
      const review = questions.map((question, index) => ({
        questionId:question.id,
        selectedAnswer:answers[index],
        correctAnswer:question.correctAnswer,
        timedOut:answers[index] === null
      }));
      progress.attempts.push({ quizId:quiz.id, courseId:course.id, score, total:questions.length, percent, durationSeconds, answers:review, date:new Date().toISOString() });
      save();
      const wrongAnswers = review.map((answer, index) => ({ ...answer, question:questions[index] })).filter(answer => answer.selectedAnswer !== answer.correctAnswer);
      const rating = percent >= 90 ? 'ممتاز' : percent >= 80 ? 'جيد جدًا' : percent >= 65 ? 'جيد' : percent >= 50 ? 'مقبول' : 'يحتاج إلى مراجعة';
      const durationLabel = durationSeconds < 60
        ? `${durationSeconds} ثانية`
        : `${Math.floor(durationSeconds / 60)} دقيقة و${durationSeconds % 60} ثانية`;
      const reviewContent = wrongAnswers.length
        ? `<section class="quiz-review mt-4"><div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-3"><h3 class="h5 fw-bold mb-0">مراجعة الإجابات غير الصحيحة</h3><span class="category-label">${wrongAnswers.length} أخطاء</span></div><div class="d-grid gap-3">${wrongAnswers.map((answer, index) => `<article class="quiz-review-item"><h4 class="h6 fw-bold mb-3">${index + 1}. ${safe(answer.question.text)}</h4><p class="quiz-answer-wrong mb-2"><strong>${answer.timedOut ? 'لم تتم الإجابة' : 'إجابتك'}</strong>${answer.timedOut ? ' · انتهى الوقت' : `: ${safe(answer.question.options[answer.selectedAnswer])}`}</p><p class="quiz-answer-correct mb-0"><strong>الإجابة الصحيحة:</strong> ${safe(answer.question.options[answer.correctAnswer])}</p>${answer.question.explanation ? `<p class="quiz-explanation mb-0">${safe(answer.question.explanation)}</p>` : ''}</article>`).join('')}</div></section>`
        : '<div class="alert alert-success mt-4 mb-0">أحسنت، لم تسجل أي إجابة خاطئة.</div>';
      form.innerHTML = `<section class="quiz-result-page" role="status"><div class="content-card quiz-result-card p-4 p-md-5"><div class="text-center"><div class="eyebrow mb-2">اكتمل الاختبار</div><h2 class="h4 fw-bold mb-3">${safe(quiz.title)}</h2><div class="quiz-score-main" aria-label="${score} من ${questions.length}"><span>${score}</span><span class="quiz-score-divider">/</span><span>${questions.length}</span></div><div class="quiz-score-rating">${rating} · ${percent}%</div><div class="quiz-result-meta"><div><span class="quiz-meta-label">الوقت المستغرق</span><strong>${durationLabel}</strong></div><div><span class="quiz-meta-label">الإجابات الخاطئة</span><strong>${wrongAnswers.length} من ${questions.length}</strong></div></div><p class="quiz-saved-message mb-0"><span aria-hidden="true">✓</span> تم حفظ نتيجتك بنجاح في سجل مراجعاتك.</p></div>${reviewContent}<div class="text-center mt-4"><a class="btn btn-basmala" href="#course/${safe(course.id)}">العودة إلى المقرر</a></div></div></section>`;
    }

    form.addEventListener('change', event => {
      if (event.target.matches('input[type="radio"]')) acceptAnswer(Number(event.target.value), false);
    });
    renderQuestion();
  }
  function bindCourseButtons() {
    document.querySelectorAll('[data-course]').forEach(button => button.addEventListener('click', () => { location.hash = `course/${button.dataset.course}`; }));
    document.querySelectorAll('[data-favorite]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.favorite;
      progress.favorites = progress.favorites.includes(id) ? progress.favorites.filter(item => item !== id) : [...progress.favorites,id]; save(); render();
    }));
    document.querySelectorAll('[data-course-completion]').forEach(checkbox => checkbox.addEventListener('change', () => {
      const id = checkbox.dataset.courseCompletion;
      progress.completedCourses = checkbox.checked
        ? [...new Set([...progress.completedCourses,id])]
        : progress.completedCourses.filter(item => item !== id);
      save();
      render();
    }));
  }
  window.addEventListener('hashchange', render);
  render();
})();
