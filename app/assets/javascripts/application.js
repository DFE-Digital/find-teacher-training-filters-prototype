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
  const activeFiltersContainer = document.querySelector('[data-active-filters-container]')
  const activeFiltersList = document.querySelector('[data-active-filters]')
  const clearFiltersLink = document.querySelector('[data-clear-filters]')
  const clearInlineLink = document.querySelector('[data-clear-filters-inline]')

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

    if (updateCount) {
      const counter = category.querySelector('.app-c-filter-section__count')
      if (counter) {
        const countToShow = selectedInputs.length
        counter.textContent = countToShow > 0 ? `${countToShow} selected` : ''
        counter.hidden = countToShow === 0
      }
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
    'sort': 'Sort by: Distance',
    'sort-1': 'Sort by: Course name (a to z)',
    'sort-2': 'Sort by: Provider name (a to z)',
    'sort-3': 'Sort by: Start date',
    'sort-4': 'Sort by: Fee or salary'
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

  const renderActiveFilters = () => {
    activeFiltersList.innerHTML = ''

    if (appliedFilterIds.size === 0) {
      activeFiltersContainer.hidden = true
      if (clearInlineLink) clearInlineLink.hidden = true
      return
    }

    activeFiltersContainer.hidden = false
    if (clearInlineLink) clearInlineLink.hidden = false

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

    filterCategories.forEach(category => updateCategorySelection(category, true))
    updateHeadingFromLocation()
    renderActiveFilters()
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
    })
  }

  const applyButton = filterPanel.querySelector('.app-c-filter-panel__action--submit')
  if (applyButton) {
    applyButton.addEventListener('click', () => {
      applyFilters()
      setExpandedState(false)
    })
  }

  const updateHeadingFromLocation = () => {
    if (!resultsHeading) return
    const locationInput = document.getElementById('search-by-location')
    const text = locationInput ? locationInput.value.trim() : ''
    const baseCountMatch = resultsHeading.textContent.match(/\((\d+)\)/)
    const count = baseCountMatch ? baseCountMatch[1] : '231'
    resultsHeading.textContent = text ? `Courses in ${text} (${count})` : `Courses (${count})`
  }

  const searchButton = document.querySelector('.app-search-submit .govuk-button')
  if (searchButton) {
    searchButton.addEventListener('click', e => {
      e.preventDefault()
      applyFilters()
      updateHeadingFromLocation()
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

    if (newState) {
      const firstFocusable = content.querySelector(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (firstFocusable) {
        firstFocusable.focus({ preventScroll: true })
      }
    }
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
