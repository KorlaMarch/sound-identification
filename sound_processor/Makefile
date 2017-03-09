CC=g++
CFLAGS=-O3 -std=c++11 -Iinclude -c -Wall
LDFLAGS=-O2 -std=c++11
SOURCES=main.cpp windowing.cpp distance.cpp
OBJECTS=$(addsuffix .o, $(basename ${SOURCES}))
EXECUTABLE=.\..\sound-processor.exe
DLL= lib\libsndfile-1.lib
#Uncomment the following to enable debugging
#CFLAGS+=-g -DDEBUG
	
all: $(OBJECTS) $(EXECUTABLE)

$(EXECUTABLE): $(OBJECTS)
	$(CC) $(LDFLAGS) $(OBJECTS) -o $@ $(DLL)
	
.cpp.o: *.h
	$(CC) $(CFLAGS) $< -o $@

clean: 
	-del ${EXECUTABLE} ${OBJECTS}
	
.PHONY: all clean

