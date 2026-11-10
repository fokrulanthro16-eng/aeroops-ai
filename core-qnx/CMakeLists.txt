cmake_minimum_required(VERSION 3.14)
project(AeroOpsSafetyKernel VERSION 3.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Safety Critical Flags for DO-178C Level A Determinism
if(MSVC)
    add_compile_options(/W4 /WX- /O2 /permissive-)
else()
    add_compile_options(-Wall -Wextra -pedantic -O3 -fno-exceptions -fno-rtti)
endif()

include_directories(include)

set(SOURCES
    src/sha256.cpp
    src/safety_kernel.cpp
    src/main.cpp
)

set(HEADERS
    include/sha256.h
    include/safety_kernel.h
)

add_executable(safety_kernel ${SOURCES} ${HEADERS})

target_include_directories(safety_kernel PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

# Optional QNX RTOS compilation detection
if(DEFINED ENV{QNX_TARGET})
    target_compile_definitions(safety_kernel PRIVATE QNX_NEUTRINO_RTOS=1)
endif()
