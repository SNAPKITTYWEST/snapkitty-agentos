cmake_minimum_required(VERSION 3.15)
project(snapkitty_agentos_apfortran VERSION 0.1.0 LANGUAGES C)

set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)

set(APFORTRAN_RUNTIME_DIR "${CMAKE_CURRENT_SOURCE_DIR}/.agentos/runtime")

set(APFORTRAN_SOURCES
  "${APFORTRAN_RUNTIME_DIR}/apfortran.c"
  "${APFORTRAN_RUNTIME_DIR}/apfortran_expr.c"
  "${APFORTRAN_RUNTIME_DIR}/apfortran_array.c"
  "${APFORTRAN_RUNTIME_DIR}/apfortran_fortran.c"
)

set(APFORTRAN_HEADERS
  "${APFORTRAN_RUNTIME_DIR}/apfortran.h"
  "${APFORTRAN_RUNTIME_DIR}/gitbucket_sqlite.h"
)

foreach(path IN LISTS APFORTRAN_SOURCES APFORTRAN_HEADERS)
  if(NOT EXISTS "${path}")
    message(FATAL_ERROR "Missing APL/Fortran source package file: ${path}")
  endif()
endforeach()

add_custom_target(apfortran_source_package ALL
  COMMAND ${CMAKE_COMMAND} -E echo "APL/Fortran source package verified"
  COMMAND ${CMAKE_COMMAND} -E echo "Native compilation is gated by npm run test:aplfortran and a Visual Studio developer shell."
  SOURCES ${APFORTRAN_SOURCES} ${APFORTRAN_HEADERS}
)

install(FILES ${APFORTRAN_SOURCES} ${APFORTRAN_HEADERS}
  DESTINATION share/snapkitty-agentos/apfortran
)
