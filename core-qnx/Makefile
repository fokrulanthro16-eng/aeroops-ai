# ==============================================================================
# AeroOps AI v3.0 - DO-178C Deterministic QNX 8.0 Safety Kernel
# Architecture: x86_64 / QNX Neutrino RTOS 8.0 SDP & POSIX Host
# ==============================================================================

CXX         ?= g++
QNX_CXX     = ntox86_64-g++
CXXFLAGS    = -std=c++17 -Wall -Wextra -O3 -pedantic -Iinclude
LDFLAGS     = -lm

SRC_DIR     = src
INC_DIR     = include
BIN_DIR     = bin
QNX_BIN_DIR = bin/qnx

SRCS        = $(SRC_DIR)/sha256.cpp $(SRC_DIR)/safety_kernel.cpp $(SRC_DIR)/main.cpp
OBJS        = $(SRCS:.cpp=.o)

TARGET      = $(BIN_DIR)/safety_kernel
QNX_TARGET  = $(QNX_BIN_DIR)/safety_kernel_qnx

.PHONY: all qnx host clean test benchmark

all: host qnx

host: $(TARGET)

$(TARGET): $(SRCS)
	@mkdir -p $(BIN_DIR)
	@if command -v $(CXX) >/dev/null 2>&1; then \
		$(CXX) $(CXXFLAGS) $(SRCS) -o $(TARGET) $(LDFLAGS); \
		echo "[BUILD-HOST] Compiled $(TARGET)"; \
	else \
		echo "[BUILD-HOST] Host compiler $(CXX) not found, falling back to QNX binary build."; \
	fi

qnx: $(QNX_TARGET)

$(QNX_TARGET): $(SRCS)
	@mkdir -p $(QNX_BIN_DIR)
	@if command -v $(QNX_CXX) >/dev/null 2>&1; then \
		$(QNX_CXX) $(CXXFLAGS) $(SRCS) -o $(QNX_TARGET) $(LDFLAGS); \
		echo "[BUILD-QNX] Compiled $(QNX_TARGET) for QNX Neutrino 8.0 RTOS"; \
	elif [ -n "$$QNX_HOST" ]; then \
		$$QNX_HOST/usr/bin/$(QNX_CXX) $(CXXFLAGS) $(SRCS) -o $(QNX_TARGET) $(LDFLAGS); \
		echo "[BUILD-QNX] Compiled $(QNX_TARGET) via QNX_HOST"; \
	else \
		echo "[BUILD-QNX] QNX compiler $(QNX_CXX) not in PATH. Please run through qnxsdp-env."; \
	fi

test:
	@if [ -f $(TARGET) ]; then \
		$(TARGET); \
	elif [ -f $(QNX_TARGET) ]; then \
		echo "Host binary not present, QNX ELF binary ready at $(QNX_TARGET)"; \
	fi

benchmark:
	@if [ -f $(TARGET) ]; then \
		$(TARGET) --benchmark; \
	fi

clean:
	rm -rf $(BIN_DIR) $(SRC_DIR)/*.o
