library(tidyverse)
library(meToolkit)
context("test-build_color_palette")

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
    build_color_palette(category)

  df2 <- tibble(
    category = rep(tail(letters,5), 4),
    values = rnorm(4*5)
  ) %>%
    build_color_palette(category)

  first_five_colors <- c("#d54c3b","#73d54a","#7245ce","#cad149","#ce4ec8")

  expect_equal(unique(df$color), first_five_colors)
  expect_equal(unique(df2$color), unique(df$color))
})


test_that("Two dataframes with the same categories present will map the same colors to each category", {
  reduce_to_mappings <- . %>%
    group_by(color_by_me) %>%
    summarise(color = first(color))

  mapping_a <- tibble(
    color_by_me = rep(head(letters,5), 4),
    values = rnorm(4*5)
  ) %>%
    build_color_palette(color_by_me) %>%
    reduce_to_mappings()

  mapping_b <- tibble(
    color_by_me = rep(head(letters,5), 6),
    values = rnorm(6*5)
  ) %>%
    sample_n(size = nrow(.), replace = FALSE) %>%
    build_color_palette(color_by_me) %>%
    reduce_to_mappings()

  expect_equal(mapping_a, mapping_b)

})
