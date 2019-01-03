library(tibble)
library(meToolkit)
context("test-buildcolorpalette")

test_that("Throws an error when too many unique categories are requested", {

  df <- tibble(
    category = rep(letters, 4),
    values = rnorm(4*26)
  )

  expect_error(df %>% buildColorPallete(category))
})


test_that("Color mappings are deterministic", {

  df <- tibble(
    category = rep(head(letters,5), 4),
    values = rnorm(4*5)
  ) %>%
    buildColorPalette(category)

  df2 <- tibble(
    category = rep(tail(letters,5), 4),
    values = rnorm(4*5)
  ) %>%
    buildColorPalette(category)

  first_five_colors <- c("#d54c3b","#73d54a","#7245ce","#cad149","#ce4ec8")

  expect_equal(unique(df$color), first_five_colors)
  expect_equal(unique(df2$color), unique(df$color))
})
