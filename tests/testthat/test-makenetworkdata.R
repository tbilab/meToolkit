library(tidyverse)
context("test-makenetworkdata")

df <- tibble(
  IID = c('a', 'b', 'c', 'd', 'e'),
  snp = c(  0,   0,   1,   1,   2),
  p1  = c(  1,   1,   1,   1,   0), # 6
  p2  = c(  1,   0,   0,   1,   1), # 7
  p3  = c(  0,   0,   1,   1,   0)  # 8
) #  ID     1,   2,   3,   4,   5

phecode_info <- tibble(
  code     = c(  'p1',    'p2',    'p3'),
  category = c(  'Z' ,     'Y',     'X'),
  tooltip  = c(  'hi', 'there',     '!'),
  color    = c('pink',  'blue', 'green')
)

edges <- tibble(
  source = c(1,1,2,3,3,4,4,4,5), #case
  target = c(6,7,6,6,8,6,7,8,7)  #phecode
)


vertices <- tibble(
  snp_status = c(        0,        0,          1,          1,        2,      0,       0,       0),
  name       = c( 'case 1', 'case 2',   'case 3',   'case 4', 'case 5',   'p1',    'p2',    'p3'),
  tooltip    = c(       NA,       NA,         NA,         NA,       NA,   'hi', 'there',     '!'),
  color      = c('#bdbdbd','#bdbdbd','orangered','orangered',    'red', 'pink',  'blue', 'green'),
  size       = c(      0.1,      0.1,        0.1,        0.1,      0.1,    0.3,     0.3,     0.3),
  selectable = c(    FALSE,    FALSE,      FALSE,      FALSE,    FALSE,   TRUE,    TRUE,    TRUE),
  id         = c(        1,        2,          3,          4,        5,      6,       7,       8) %>% as.integer(),
  index      = c(        1,        2,          3,          4,        5,      6,       7,       8) %>% as.integer(),
  inverted   = c(       NA,       NA,         NA,         NA,       NA,  FALSE,   FALSE,   FALSE)
)

results <- meToolkit::makeNetworkData(df, phecode_info)

test_that("Correct edges dataframe returned", {
  expect_equal(results$edges, edges)
})

test_that("Correct vertices dataframe returned", {
  expect_equal(results$vertices, vertices)
})


test_that("Deals with inverted codes properly", {
  results_inv <- meToolkit::makeNetworkData(df, phecode_info, inverted_codes = c('p2'))
  vertices_inv <- vertices %>% mutate(inverted = c(       NA,       NA,         NA,         NA,       NA,  FALSE,   TRUE,   FALSE))

  expect_equal(results_inv$vertices, vertices_inv)
})

test_that("Size changes reflected", {
  results_sized <- meToolkit::makeNetworkData(df, phecode_info, case_size = 2, code_size = 10)
  vertices_sized <- vertices %>% mutate( size = c(2,2,2,2,2,10,10,10))

  expect_equal(results_sized$vertices, vertices_sized)
})


test_that('Handles automatically building tooltips if needed', {
  results <- meToolkit::makeNetworkData(df, phecode_info %>% select(-tooltip))
  expect_true((results$vertices %>% tail(1) %>% pull(tooltip)) == '<h2>p3</h2>')
})
