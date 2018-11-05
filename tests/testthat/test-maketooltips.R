library(tibble)
library(meToolkit)
context("test-maketooltips")

test_phewas <-
  tibble(
    id = c('a', 'b', 'c'),
    odds_ratio = c(0.0, 1.0, 2.0),
    p_val = c(0.01, 0.2, 0.04),
    description = c('a valuable description', 'another valuable insight into code function', 'yet another good description.')
  )

tooltip_column <- c(
  '<i> id </i>a</br><i> odds_ratio </i>0</br><i> p_val </i>0.01</br><i> description </i>a valuable description</br>',
  '<i> id </i>b</br><i> odds_ratio </i>1</br><i> p_val </i>0.2</br><i> description </i>another valuable insight into code function</br>',
  '<i> id </i>c</br><i> odds_ratio </i>2</br><i> p_val </i>0.04</br><i> description </i>yet another good description.</br>'
)


test_that("Constructs a tooltip", {

  tooltipified <- makeTooltips(test_phewas)

  expect_equal(ncol(tooltipified), 5)

  expect_true('tooltip' %in% colnames(tooltipified))

  expect_equal(tooltipified$tooltip, tooltip_column)

})
