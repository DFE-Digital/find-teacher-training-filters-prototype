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
  const activeFiltersContainer = document.querySelector('[data-active-filters-container]')
  const activeFiltersList = document.querySelector('[data-active-filters]')
  const clearFiltersLink = document.querySelector('[data-clear-filters]')

  if (!filterPanel || !filterToggle || !filterBackdrop || !filterSections || !searchPanel || !searchRow || !activeFiltersContainer || !activeFiltersList) {
    return
  }

  const content = filterPanel.querySelector('.app-c-filter-panel__content')
  const toggleText = filterToggle.querySelector('.app-c-filter-panel__button-inner')
  const filterCategories = filterPanel.querySelectorAll('.app-c-filter-section')
  const filterInputs = filterPanel.querySelectorAll('.app-c-filter-section input[type="checkbox"], .app-c-filter-section input[type="radio"]')

  const smallViewportQuery = window.matchMedia('(max-width: 40em)')

  const getAppliedFilterIds = () =>
    Array.from(filterInputs)
      .filter(input => input.checked)
      .map(input => input.id)

  let appliedFilterIds = new Set(getAppliedFilterIds())

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

  const updateCategorySelection = category => {
    if (!category) {
      return
    }

    const inputs = category.querySelectorAll('input[type="checkbox"], input[type="radio"]')
    const selectedInputs = Array.from(inputs).filter(input => input.checked)
    const isSelected = selectedInputs.length > 0

    const heading = category.querySelector('.app-c-filter-section__summary-heading')
    if (heading) {
      heading.classList.toggle('app-c-filter-section__summary-heading--selected', isSelected)
    }

    const counter = category.querySelector('.app-c-filter-section__count')
    if (counter) {
      counter.textContent = selectedInputs.length > 0 ? `${selectedInputs.length} selected` : ''
      counter.hidden = selectedInputs.length === 0
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

  const renderActiveFilters = () => {
    activeFiltersList.innerHTML = ''

    if (appliedFilterIds.size === 0) {
      activeFiltersContainer.hidden = true
      return
    }

    activeFiltersContainer.hidden = false

    appliedFilterIds.forEach(id => {
      const input = document.getElementById(id)
      if (!input) {
        return
      }

      const label = filterPanel.querySelector(`label[for="${CSS.escape(id)}"]`)
      if (!label) {
        return
      }

      const categoryHeading = label.closest('.app-c-filter-section')?.querySelector('.app-c-filter-section__summary-heading')
      const categoryTitle = getCategoryTitle(categoryHeading)
      const filterTitle = label.textContent.trim()
      const tagText = categoryTitle ? `${categoryTitle}: ${filterTitle}` : filterTitle

      const listItem = document.createElement('li')
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'filter__tag'
      button.setAttribute('data-remove-filter', id)
      button.innerHTML = `<span class="filter__tag--text">${tagText}</span>`

      listItem.appendChild(button)
      activeFiltersList.appendChild(listItem)
    })
  }

  const applyFilters = () => {
    appliedFilterIds = new Set()

    filterInputs.forEach(input => {
      if (input.checked) {
        appliedFilterIds.add(input.id)
      }
    })

    renderActiveFilters()
  }

  const removeFilter = id => {
    appliedFilterIds.delete(id)

    const input = document.getElementById(id)
    if (input) {
      input.checked = false
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
          input.checked = false
          input.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })

      appliedFilterIds.clear()
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
      input.addEventListener('change', () => {
        updateCategorySelection(input.closest('.app-c-filter-section'))
      })
    })

    filterCategories.forEach(category => updateCategorySelection(category))

    renderActiveFilters()

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
