//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  const filterPanel = document.querySelector('[data-filter-panel]')
  const filterToggle = document.querySelector('[data-filter-toggle]')
  const filterBackdrop = document.querySelector('[data-filter-backdrop]')
  const filterSections = filterPanel ? filterPanel.querySelector('[data-filter-sections]') : null
  const searchContainer = document.querySelector('[data-search-target]')
  const searchPanel = filterPanel ? filterPanel.querySelector('[data-search-panel]') : null
  const searchRow = document.querySelector('[data-search-top-row]')
  const resultsHeading = document.querySelector('[data-results-heading]')
  const resultsIndicator = document.querySelector('[data-results-indicator]')
  const radiusSection = filterPanel ? filterPanel.querySelector('[data-radius-section]') : null
  const INITIAL_BASE_COUNT = (() => {
    if (!resultsHeading) return '10,416'
    const match = resultsHeading.textContent.match(/\(([-0-9,]+)\)/)
    return match ? match[1] : '10,416'
  })()
  const activeFiltersContainer = document.querySelector('[data-active-filters-container]')
  const activeFiltersList = document.querySelector('[data-active-filters]')
  const clearFiltersLink = document.querySelector('[data-clear-filters]')
  const clearInlineLink = document.querySelector('[data-clear-filters-inline]')
  const actionsContainer = document.querySelector('.app-c-filter-panel__actions')
  const coursesContainer = document.querySelector('[data-courses-container]')

  if (!filterPanel || !filterToggle || !filterBackdrop || !filterSections || !searchPanel || !searchRow || !activeFiltersContainer || !activeFiltersList) {
    return
  }

  const content = filterPanel.querySelector('.app-c-filter-panel__content')
  const toggleText = filterToggle.querySelector('.app-c-filter-panel__button-inner')
  const filterCategories = filterPanel.querySelectorAll('.app-c-filter-section')
  const filterInputs = filterPanel.querySelectorAll('.app-c-filter-section input[type="checkbox"], .app-c-filter-section input[type="radio"], .app-c-filter-section input[type="text"], .app-c-filter-section select')

  const smallViewportQuery = window.matchMedia('(max-width: 40em)')

  const getAppliedFilterIds = () =>
    Array.from(filterInputs)
      .filter(input => (input.type === 'checkbox' || input.type === 'radio') ? input.checked : input.value.trim() !== '')
      .map(input => input.id)

  let appliedFilterIds = new Set()
  let countsAreApplied = false

  const lockScroll = locked => {
    document.body.classList.toggle('app-filter-panel--locked', locked)
  }

  const defaultLabel = toggleText ? toggleText.textContent.trim() : ''
  const collapsedLabel = filterToggle.getAttribute('data-collapsed-label') || defaultLabel
  const expandedLabel = filterToggle.getAttribute('data-expanded-label') || collapsedLabel

  const toggleLabel = (expanded, isSmallViewport) => {
    if (!toggleText) {
      return
    }

    if (isSmallViewport) {
      toggleText.textContent = expanded ? expandedLabel : collapsedLabel
    } else {
      toggleText.textContent = defaultLabel
    }
  }

  const moveSearchIntoTopRow = () => {
    if (searchContainer && !searchContainer.contains(searchPanel)) {
      searchContainer.appendChild(searchPanel)
    }

    if (searchRow) {
      searchRow.hidden = false
    }
  }

  const restoreSearchToPanel = () => {
    const panelInner = filterPanel.querySelector('[data-search-panel-home]')
    if (panelInner && !panelInner.contains(searchPanel)) {
      panelInner.insertBefore(searchPanel, panelInner.firstChild)
    }

    if (searchRow) {
      searchRow.hidden = true
    }
  }

  const updateCategorySelection = (category, updateCount = false) => {
    if (!category) {
      return
    }

    const inputs = category.querySelectorAll('input[type="checkbox"], input[type="radio"], input[type="text"]')
    const selectedInputs = Array.from(inputs).filter(input => {
      if (input.type === 'text') {
        return input.value.trim() !== ''
      }
      return input.checked
    })
    const isSelected = selectedInputs.length > 0

    const heading = category.querySelector('.app-c-filter-section__summary-heading')
    if (heading) {
      heading.classList.toggle('app-c-filter-section__summary-heading--selected', isSelected)
    }

    // Manage the {number} selected indicator DOM
    let counter = category.querySelector('.app-c-filter-section__count')
    const countToShow = updateCount ? selectedInputs.length : 0
    if (countToShow > 0) {
      if (!counter) {
        counter = document.createElement('span')
        counter.className = 'app-c-filter-section__count govuk-hint'
        const summary = category.querySelector('.app-c-filter-section__summary')
        // Insert after the heading inside the summary
        if (summary) {
          summary.appendChild(counter)
        } else if (heading && heading.parentElement) {
          heading.parentElement.appendChild(counter)
        }
      }
      counter.textContent = `${countToShow} selected`
      counter.hidden = false
    } else if (counter) {
      // Remove completely when not needed to avoid layout gaps
      counter.remove()
    }
  }

  const getCategoryTitle = heading => {
    if (!heading) {
      return ''
    }

    const clone = heading.cloneNode(true)
    clone.querySelectorAll('.govuk-visually-hidden, .app-c-filter-section__count').forEach(node => node.remove())

    return clone.textContent.trim()
  }

  const primaryActiveFilterLabels = {
    primary: 'Primary',
    'primary-2': 'Primary with English',
    'primary-3': 'Primary with geography and history',
    'primary-4': 'Primary with mathematics',
    'primary-5': 'Primary with modern languages',
    'primary-6': 'Primary with physical education',
    'primary-7': 'Primary with science'
  }

  const secondaryActiveFilterLabels = {
    secondary: 'Ancient Greek',
    'secondary-2': 'Ancient Hebrew',
    'secondary-3': 'Art and design',
    'secondary-4': 'Biology',
    'secondary-5': 'Business studies',
    'secondary-6': 'Chemistry',
    'secondary-7': 'Citizenship',
    'secondary-8': 'Classes',
    'secondary-9': 'Communication and media studies',
    'secondary-10': 'Computing',
    'secondary-11': 'Dance',
    'secondary-12': 'Design and technology',
    'secondary-13': 'Drama',
    'secondary-14': 'Economics',
    'secondary-15': 'English',
    'secondary-16': 'French',
    'secondary-17': 'Geography',
    'secondary-18': 'German',
    'secondary-19': 'Health and social care',
    'secondary-20': 'History',
    'secondary-21': 'Italian',
    'secondary-22': 'Japanese',
    'secondary-23': 'Latin',
    'secondary-24': 'Mandarin',
    'secondary-25': 'Mathematics',
    'secondary-26': 'Modern languages (other)',
    'secondary-27': 'Music',
    'secondary-28': 'Philosophy',
    'secondary-29': 'Physical education',
    'secondary-30': 'Physical education with an EBacc subject',
    'secondary-31': 'Physics',
    'secondary-32': 'Psychology',
    'secondary-33': 'Religious education',
    'secondary-34': 'Russian',
    'secondary-35': 'Science',
    'secondary-36': 'Social sciences',
    'secondary-37': 'Spanish'
  }

  const searchRadiusActiveFilterLabels = {
    'radius': 'Search radius: 10 miles',
    'radius-2': 'Search radius: 20 miles',
    'radius-3': 'Search radius: 50 miles',
    'radius-4': 'Search radius: 100 miles'
  }

  const sortByActiveFilterLabels = {
    'sort': 'Sort by: Nearest distance',
    'sort-1': 'Sort by: Course name (a to z)',
    'sort-2': 'Sort by: Provider (a to z)',
    'sort-3': 'Sort by: Soonest start date',
    'sort-4': 'Sort by: Lowest fee'
  }

  const furtherEducationActiveFilterLabels = {
    'fe-1': 'Further education',
  }

  const SendActiveFilterLabels = {
    'send': 'Courses with a SEND specialism',
  }

  const FeeOrSalaryActiveFilterLabels = {
    'fee': 'Fee-paying courses',
    'fee-2': 'Courses with a salary',
    'fee-3': 'Apprenticeships courses',
  }

  const FullTimePartTimeActiveFilterLabels = {
    'full-time': 'Full-time',
    'part-time': 'Part-time',
  }

  const QualificationActiveFilterLabels = {
    'qualification': 'Qualification: QTS only',
    'qualification-2': 'Qualification: QTS with PGCE or PGDE',
  }

  const DegreeGradeActiveFilterLabels = {
    'degree-grade': 'Degree grade: 2:1 or first',
    'degree-grade-2': 'Degree grade: 2:2',
    'degree-grade-3': 'Degree grade: Third',
    'degree-grade-4': 'Degree grade: Pass',
    'degree-grade-5': 'Degree grade: No degree',
    'degree-grade-6': 'Degree grade: Show all courses',
  }

  const VisaSponsorshipActiveFilterLabels = {
    'visa-1': 'Courses with visa sponsorship',
  }

  const OnlineInterviewsActiveFilterLabels = {
    'filter-interview': 'Courses with online interviews',
  }

  const StartDateActiveFilterLabels = {
    'filter-start': 'Start date: January to August 2026',
    'filter-start-2': 'Start date: September 2026 only',
    'filter-start-3': 'Start date: October 2026 to July 2027',
  }

  const activeFilterLabelMap = {
    ...primaryActiveFilterLabels,
    ...secondaryActiveFilterLabels,
    ...searchRadiusActiveFilterLabels,
    ...sortByActiveFilterLabels,
    ...furtherEducationActiveFilterLabels,
    ...SendActiveFilterLabels,
    ...FeeOrSalaryActiveFilterLabels,
    ...FullTimePartTimeActiveFilterLabels,
    ...QualificationActiveFilterLabels,
    ...DegreeGradeActiveFilterLabels,
    ...VisaSponsorshipActiveFilterLabels,
    ...OnlineInterviewsActiveFilterLabels,
    ...StartDateActiveFilterLabels,
  }

  const getActiveFilterLabel = (id, defaultLabel) => activeFilterLabelMap[id] || defaultLabel

  const trainProviderInput = filterPanel.querySelector('#training-provider')

  // Clear the Subject autocomplete and underlying select safely
  const clearSubjectField = () => {
    const subjectSelect = document.getElementById('search-by-subject')
    if (!subjectSelect) return

    // Clear native select
    subjectSelect.value = ''
    if (subjectSelect.options && subjectSelect.options.length > 0) {
      subjectSelect.selectedIndex = 0
    }

    // Clear enhanced autocomplete input if present
    const wrapper = subjectSelect.parentNode ? subjectSelect.parentNode.querySelector('.autocomplete__wrapper') : null
    const autoInput = wrapper ? wrapper.querySelector('input') : null
    if (autoInput) {
      autoInput.value = ''
      autoInput.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  // Build a subject name -> input id index by scanning the DOM (keeps in sync with filters)
  let subjectNameToId = new Map()
  const buildSubjectNameToId = () => {
    subjectNameToId = new Map()
    const subjectInputs = filterPanel.querySelectorAll('input[name="primary-subjects"], input[name="secondary-subjects"]')
    subjectInputs.forEach(input => {
      const label = filterPanel.querySelector(`label[for="${CSS.escape(input.id)}"]`)
      const text = label ? label.textContent.trim() : ''
      if (text) {
        subjectNameToId.set(text, input.id)
      }
    })
  }

  const renderActiveFilters = () => {
    activeFiltersList.innerHTML = ''

    if (appliedFilterIds.size === 0) {
      activeFiltersContainer.hidden = true
      if (clearInlineLink) clearInlineLink.hidden = true
      if (actionsContainer) actionsContainer.classList.add('app-c-filter-panel__actions--single')
      return
    }

    activeFiltersContainer.hidden = false
    if (clearInlineLink) clearInlineLink.hidden = false
    if (actionsContainer) actionsContainer.classList.remove('app-c-filter-panel__actions--single')

    const createTextTag = (id, labelText) => {
      const listItem = document.createElement('li')
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'filter__tag'
      button.setAttribute('data-remove-filter', id)
      button.innerHTML = `<span class="filter__tag--text">${labelText}</span>`
      listItem.appendChild(button)
      activeFiltersList.appendChild(listItem)
    }

    appliedFilterIds.forEach(id => {
      if (id === 'training-provider') {
        if (trainProviderInput && trainProviderInput.value.trim()) {
          createTextTag(id, `Provider: ${trainProviderInput.value.trim()}`)
        }
        return
      }

      const input = document.getElementById(id)
      if (!input) {
        return
      }

      const label = filterPanel.querySelector(`label[for="${CSS.escape(id)}"]`)
      const defaultLabel = (() => {
        if (!label) {
          return ''
        }

        const categoryHeading = label.closest('.app-c-filter-section')?.querySelector('.app-c-filter-section__summary-heading')
        const categoryTitle = getCategoryTitle(categoryHeading)
        const filterTitle = label.textContent.trim()
        return categoryTitle ? `${categoryTitle}: ${filterTitle}` : filterTitle
      })()

      const tagText = getActiveFilterLabel(id, defaultLabel)
      if (!tagText) {
        return
      }

      createTextTag(id, tagText)
    })
  }

  // Toggle radius section visibility based on location field value
  const toggleRadiusVisibilityFromLocation = () => {
    if (!radiusSection) return
    const locationInput = document.getElementById('search-by-location')
    const text = locationInput ? locationInput.value.trim() : ''
    radiusSection.hidden = !text
  }

  // Handle zero-results behaviour for Salary selection and restore on clear
  const updateCoursesVisibilityFromSalary = () => {
    const salarySelected = appliedFilterIds.has('fee-2')
    if (salarySelected) {
      if (coursesContainer) coursesContainer.hidden = true
      if (resultsHeading) {
        const headingText = resultsHeading.textContent.replace(/\(([^)]*)\)/, '(0)')
        resultsHeading.textContent = headingText
      }
      if (resultsIndicator) resultsIndicator.textContent = '0 results'
    } else {
      if (coursesContainer) coursesContainer.hidden = false
      // Recompute a non-zero count for prototype and update H1/indicator
      updateHeadingFromLocation()
      // If still showing zero, reset back to initial base count
      if (resultsHeading) {
        const match = resultsHeading.textContent.match(/\(([-0-9,]+)\)/)
        const num = match ? parseInt(String(match[1]).replace(/,/g, ''), 10) : 0
        if (!(num > 0)) {
          const newText = resultsHeading.textContent.replace(/\(([^)]*)\)/, `(${INITIAL_BASE_COUNT})`)
          resultsHeading.textContent = newText
        }
      }
      if (resultsIndicator) {
        const current = resultsIndicator.textContent
        const n = parseInt(current.replace(/[^0-9]/g, ''), 10)
        if (!(n > 0)) resultsIndicator.textContent = `${INITIAL_BASE_COUNT} results`
      }
    }
  }

  // Defer adding provider tag until Apply is clicked

  const applyFilters = () => {
    appliedFilterIds = new Set()
    countsAreApplied = true

    filterInputs.forEach(input => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        if (input.checked) {
          appliedFilterIds.add(input.id)
        }
      } else if (input.value.trim()) {
        appliedFilterIds.add(input.id)
      }
    })

    // If a subject was chosen via the top autocomplete, sync to the matching checkbox id
    const subjectInput = document.getElementById('search-by-subject')
    const chosenSubject = subjectInput ? subjectInput.value.trim() : ''
    const matchedId = chosenSubject ? subjectNameToId.get(chosenSubject) : ''
    if (matchedId) {
      const matchedCheckbox = document.getElementById(matchedId)
      if (matchedCheckbox && matchedCheckbox.type === 'checkbox') {
        matchedCheckbox.checked = true
        appliedFilterIds.add(matchedId)
      }
    }

    // Only add a radius tag when a location is set AND a non-default radius is chosen
    const selectedRadius = document.querySelector('input[name="search-radius"]:checked')
    const selectedRadiusId = selectedRadius ? selectedRadius.id : ''
    const locationValue = (document.getElementById('search-by-location')?.value || '').trim()
    if (!locationValue || selectedRadiusId === 'radius') {
      appliedFilterIds.delete('radius')
      appliedFilterIds.delete('radius-2')
      appliedFilterIds.delete('radius-3')
      appliedFilterIds.delete('radius-4')
    }

    filterCategories.forEach(category => updateCategorySelection(category, true))
    updateHeadingFromLocation()
    renderActiveFilters()

    updateCoursesVisibilityFromSalary()
  }

  const removeFilter = id => {
    appliedFilterIds.delete(id)

    const input = document.getElementById(id)
    if (input) {
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = false
      } else {
        input.value = ''
      }
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }

    renderActiveFilters()
    updateCoursesVisibilityFromSalary()
  }

  activeFiltersList.addEventListener('click', event => {
    const target = event.target.closest('[data-remove-filter]')
    if (!target) {
      return
    }

    event.preventDefault()
    const id = target.getAttribute('data-remove-filter')
    removeFilter(id)
  })

  if (clearFiltersLink) {
    clearFiltersLink.addEventListener('click', event => {
      event.preventDefault()

      appliedFilterIds.forEach(id => {
        const input = document.getElementById(id)
        if (input) {
          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false
          } else {
            input.value = ''
          }
          input.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })

      appliedFilterIds.clear()
      renderActiveFilters()
      updateCoursesVisibilityFromSalary()
    })
  }

  if (clearInlineLink) {
    clearInlineLink.addEventListener('click', event => {
      event.preventDefault()

      appliedFilterIds.forEach(id => {
        const input = document.getElementById(id)
        if (input) {
          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false
          } else {
            input.value = ''
          }
          input.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })

      appliedFilterIds.clear()
      countsAreApplied = true
      filterCategories.forEach(category => updateCategorySelection(category, true))
      renderActiveFilters()
      updateCoursesVisibilityFromSalary()
    })
  }

  const applyButton = filterPanel.querySelector('.app-c-filter-panel__action--submit')
  if (applyButton) {
    applyButton.addEventListener('click', () => {
      applyFilters()
      setExpandedState(false)
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    })
  }

  const updateHeadingFromLocation = () => {
    if (!resultsHeading) return
    const locationInput = document.getElementById('search-by-location')
    const text = locationInput ? locationInput.value.trim() : ''
    const providerInput = document.getElementById('training-provider')
    const providerText = providerInput ? providerInput.value.trim() : ''
    const baseCountMatch = resultsHeading.textContent.match(/\((\d+)\)/)
    const baseCount = baseCountMatch ? baseCountMatch[1] : '10,416'
    const getRangeForRadius = () => {
      const selected = document.querySelector('input[name="search-radius"]:checked')
      const id = selected ? selected.id : ''
      switch (id) {
        case 'radius':   // 10 miles
          return [50, 100]
        case 'radius-2': // 20 miles
          return [100, 150]
        case 'radius-3': // 50 miles
          return [150, 200]
        case 'radius-4': // 100 miles
          return [200, 250]
        default:
          return [50, 250]
      }
    }
    let count
    if (providerText) {
      // When training provider is filled, constrain results to 1–20
      const min = 1
      const max = 20
      count = String(Math.floor(Math.random() * (max - min + 1)) + min)
    } else if (text) {
      const [min, max] = getRangeForRadius()
      count = String(Math.floor(Math.random() * (max - min + 1)) + min)
    } else {
      count = baseCount
    }
    let headingText
    if (providerText && text) {
      headingText = `Courses at ${providerText} in ${text} (${count})`
    } else if (providerText) {
      headingText = `Courses at ${providerText} (${count})`
    } else if (text) {
      headingText = `Courses in ${text} (${count})`
    } else {
      headingText = `Courses (${count})`
    }
    if (resultsHeading) resultsHeading.textContent = headingText
    if (resultsIndicator) resultsIndicator.textContent = `${count} results`
  }

  const searchButton = document.querySelector('.app-search-submit .govuk-button')
  if (searchButton) {
    searchButton.addEventListener('click', e => {
      e.preventDefault()
      // Sync chosen subject into its matching checkbox so it becomes an active filter
      buildSubjectNameToId()
      const subjectSelect = document.getElementById('search-by-subject')
      const chosenSubject = subjectSelect ? subjectSelect.value.trim() : ''
      const matchedId = chosenSubject ? subjectNameToId.get(chosenSubject) : ''
      if (matchedId) {
        const checkbox = document.getElementById(matchedId)
        if (checkbox && checkbox.type === 'checkbox') {
          checkbox.checked = true
          checkbox.dispatchEvent(new Event('change', { bubbles: true }))
        }
      }

      // Apply to compute and display active filters
      applyFilters()
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    })
  }

  const setExpandedState = expanded => {
    const isSmallViewport = smallViewportQuery.matches

    filterToggle.setAttribute('aria-expanded', expanded)
    filterPanel.classList.toggle('app-c-filter-panel--expanded', expanded && isSmallViewport)
    filterPanel.classList.toggle('app-c-filter-panel--collapsed', !expanded && isSmallViewport)

    filterSections.hidden = !!(isSmallViewport && !expanded)
    filterBackdrop.hidden = !expanded || !isSmallViewport

    lockScroll(expanded && isSmallViewport)
    toggleLabel(expanded, isSmallViewport)
    if (isSmallViewport) {
      restoreSearchToPanel()
    } else {
      moveSearchIntoTopRow()
    }
  }

  filterToggle.addEventListener('click', () => {
    const isExpanded = filterToggle.getAttribute('aria-expanded') === 'true'
    const newState = smallViewportQuery.matches ? !isExpanded : true
    setExpandedState(newState)
  })

  filterBackdrop.addEventListener('click', () => {
    setExpandedState(false)
    filterToggle.focus()
  })

  const bindEscape = () => {
    document.addEventListener('keydown', closeOnEscape)
  }

  const unbindEscape = () => {
    document.removeEventListener('keydown', closeOnEscape)
  }

  const closeOnEscape = event => {
    if (event.key === 'Escape' && smallViewportQuery.matches) {
      setExpandedState(false)
      filterToggle.focus()
    }
  }

  const handleViewportChange = event => {
    setExpandedState(!event.matches)

    if (event.matches) {
      restoreSearchToPanel()
      bindEscape()
    } else {
      moveSearchIntoTopRow()
      unbindEscape()
    }
  }

  const init = () => {
    if (!smallViewportQuery.matches) {
      moveSearchIntoTopRow()
    }

    setExpandedState(!smallViewportQuery.matches)

    filterInputs.forEach(input => {
      const category = input.closest('.app-c-filter-section')

      const handleChange = () => {
        // Do not update counts in real time; only toggle selected class
        updateCategorySelection(category, false)
      }

      const eventName = input.type === 'checkbox' || input.type === 'radio' ? 'change' : 'input'
      input.addEventListener(eventName, handleChange)
    })

    // On first load: keep any default inputs checked, but do not
    // show counts or active filter tags until Apply/Search is used
    filterCategories.forEach(category => updateCategorySelection(category, false))
    renderActiveFilters()
    buildSubjectNameToId()

    document.querySelectorAll('[data-save-course-target="button"]').forEach(button => {
      const icon = button.querySelector('[data-save-course-target="icon"]')
      const text = button.querySelector('[data-save-course-target="text"]')

      button.addEventListener('click', () => {
        const isSaved = button.getAttribute('data-state') === 'saved'
        const newState = isSaved ? 'unsaved' : 'saved'

        button.setAttribute('data-state', newState)
        button.classList.toggle('is-saved', !isSaved)

        if (icon) {
          icon.setAttribute('data-state', newState)
          icon.classList.toggle('is-saved', !isSaved)
        }

        if (text) {
          text.textContent = newState === 'saved' ? 'Saved' : 'Save this course for later'
        }
      })
    })

    if (smallViewportQuery.matches) {
      bindEscape()
    } else {
      unbindEscape()
    }
  }

  const subscribeToViewportChanges = () => {
    if (typeof smallViewportQuery.addEventListener === 'function') {
      smallViewportQuery.addEventListener('change', handleViewportChange)
    } else if (typeof smallViewportQuery.addListener === 'function') {
      smallViewportQuery.addListener(handleViewportChange)
    }
  }

  init()
  subscribeToViewportChanges()
})
