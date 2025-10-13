//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  const filterPanel = document.querySelector('[data-filter-panel]')
  const filterToggle = document.querySelector('[data-filter-toggle]')
  const filterBackdrop = document.querySelector('[data-filter-backdrop]')
  const filterSections = filterPanel.querySelector('[data-filter-sections]')
  const searchContainer = document.querySelector('[data-search-target]')
  const searchPanel = filterPanel.querySelector('[data-search-panel]')
  const searchRow = document.querySelector('[data-search-top-row]')

  if (!filterPanel || !filterToggle || !filterBackdrop || !filterSections || !searchPanel || !searchRow) {
    return
  }

  const content = filterPanel.querySelector('.app-c-filter-panel__content')
  const toggleText = filterToggle.querySelector('.app-c-filter-panel__button-inner')

  const smallViewportQuery = window.matchMedia('(max-width: 40em)')

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
