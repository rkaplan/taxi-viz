cmake_minimum_required(VERSION 2.8)

project(TaxiViz)

find_package(Boost COMPONENTS system thread signals)
find_library(wt wtd)
find_library(wthttp wthttpd)

include_directories(~/mongo-client-install/include)
link_directories(~/mongo-client-install/lib)

include_directories(/usr/local/include)
link_directories(/usr/local/lib)

add_executable(server.wt src/server.cpp)

target_link_libraries(server.wt
	${Boost_SYSTEM_LIBRARY}
	${Boost_THREAD_LIBRARY}
	${Boost_SIGNALS_LIBRARY}
	${wt}
	${wthttp}
	mongoclient
)